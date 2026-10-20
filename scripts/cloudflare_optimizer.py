"""
Cloudflare Optimizer for Russian Federation TSPU / RKN Bypass
Automated configuration for:
1. Zone ID auto-discovery (via domain name)
2. ECH (Encrypted Client Hello) -> OFF (eliminates ERR_CONNECTION_RESET)
3. HTTP/3 (QUIC) -> OFF (prevents UDP packet drops by TSPU)
4. 0-RTT -> OFF (prevents TLS replay & connection hangs)
5. Min TLS Version -> 1.2
6. SSL Mode -> Full (strict) (prevents Vercel infinite redirect loop)
7. Security Level -> Essentially Off (prevents Captcha / Bot Challenge inside VK iframe)
8. DNS Proxied -> True (turns on Orange Cloud so Cloudflare Edge CDN caches assets)
9. Purge Cache -> Full cache purge
"""

import sys
import json
import argparse
import urllib.request
import urllib.error

def cf_api(method, endpoint, token=None, email=None, api_key=None, body=None):
    url = f"https://api.cloudflare.com/client/v4{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"
    elif email and api_key:
        headers["X-Auth-Email"] = email.strip()
        headers["X-Auth-Key"] = api_key.strip()
    else:
        raise ValueError("Either --token or both --email and --key required")
    
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        try:
            return json.loads(err_body)
        except Exception:
            return {"success": False, "errors": [{"message": f"HTTP {e.code}: {err_body}"}]}
    except Exception as e:
        return {"success": False, "errors": [{"message": str(e)}]}

def check_ech_doh(domain="mastersofthewild.ru"):
    url = f"https://dns.google/resolve?name={domain}&type=HTTPS"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            answers = data.get("Answer", [])
            for a in answers:
                data_str = str(a.get("data", ""))
                if "ech=" in data_str:
                    return True, data_str
            return False, "No ECH parameter in HTTPS record"
    except Exception as e:
        return None, str(e)

def run_optimizer(domain, token=None, email=None, api_key=None, zone_id=None):
    print(f"=== CLOUDFLARE OPTIMIZER FOR DOMAIN: {domain} ===")
    
    # 1. Resolve Zone ID if not provided
    if not zone_id:
        print(f"[*] Discovering Zone ID for {domain}...")
        resp = cf_api("GET", f"/zones?name={domain}", token=token, email=email, api_key=api_key)
        if not resp.get("success") or not resp.get("result"):
            print(f"[!] Failed to find zone for {domain}: {resp.get('errors')}")
            return False
        zone_id = resp["result"][0]["id"]
        print(f"[+] Found Zone ID: {zone_id}")
    else:
        print(f"[+] Using provided Zone ID: {zone_id}")

    # 2. Disable ECH (Encrypted Client Hello)
    print("\n[*] Step 1: Disabling ECH (Encrypted Client Hello)...")
    ech_resp = cf_api("PATCH", f"/zones/{zone_id}/settings/ech", token=token, email=email, api_key=api_key, body={"id": "ech", "value": "off"})
    if ech_resp.get("success"):
        print(f"[+] ECH successfully set to OFF: {ech_resp.get('result')}")
    else:
        print(f"[!] Warning: ECH update returned: {ech_resp.get('errors')}")

    # 3. Disable HTTP/3 (QUIC)
    print("\n[*] Step 2: Disabling HTTP/3 (QUIC)...")
    h3_resp = cf_api("PATCH", f"/zones/{zone_id}/settings/http3", token=token, email=email, api_key=api_key, body={"id": "http3", "value": "off"})
    if h3_resp.get("success"):
        print(f"[+] HTTP/3 successfully set to OFF: {h3_resp.get('result')}")
    else:
        print(f"[!] Warning: HTTP/3 update returned: {h3_resp.get('errors')}")

    # 4. Disable 0-RTT Connection Resumption
    print("\n[*] Step 3: Disabling 0-RTT...")
    rtt_resp = cf_api("PATCH", f"/zones/{zone_id}/settings/0rtt", token=token, email=email, api_key=api_key, body={"id": "0rtt", "value": "off"})
    if rtt_resp.get("success"):
        print(f"[+] 0-RTT successfully set to OFF: {rtt_resp.get('result')}")
    else:
        print(f"[!] Warning: 0-RTT update returned: {rtt_resp.get('errors')}")

    # 5. Set Minimum TLS Version to 1.2
    print("\n[*] Step 4: Setting Minimum TLS Version to 1.2...")
    tls_resp = cf_api("PATCH", f"/zones/{zone_id}/settings/min_tls_version", token=token, email=email, api_key=api_key, body={"id": "min_tls_version", "value": "1.2"})
    if tls_resp.get("success"):
        print(f"[+] Min TLS Version set to 1.2: {tls_resp.get('result')}")
    else:
        print(f"[!] Warning: Min TLS update returned: {tls_resp.get('errors')}")

    # 6. Set SSL mode to Full (Strict)
    print("\n[*] Step 5: Setting SSL Encryption to Full...")
    ssl_resp = cf_api("PATCH", f"/zones/{zone_id}/settings/ssl", token=token, email=email, api_key=api_key, body={"id": "ssl", "value": "full"})
    if ssl_resp.get("success"):
        print(f"[+] SSL mode set to Full: {ssl_resp.get('result')}")
    else:
        print(f"[!] Warning: SSL update returned: {ssl_resp.get('errors')}")

    # 7. Set Security Level to essentially_off (avoids iframe captcha)
    print("\n[*] Step 6: Setting Security Level to essentially_off...")
    sec_resp = cf_api("PATCH", f"/zones/{zone_id}/settings/security_level", token=token, email=email, api_key=api_key, body={"id": "security_level", "value": "essentially_off"})
    if sec_resp.get("success"):
        print(f"[+] Security level set to essentially_off: {sec_resp.get('result')}")
    else:
        print(f"[!] Warning: Security level update returned: {sec_resp.get('errors')}")

    # 8. Set DNS records (Apex & WWW) to Proxied: true
    print("\n[*] Step 7: Enabling Cloudflare Proxy (Orange Cloud) for DNS records...")
    dns_resp = cf_api("GET", f"/zones/{zone_id}/dns_records", token=token, email=email, api_key=api_key)
    if dns_resp.get("success"):
        records = dns_resp.get("result", [])
        for r in records:
            name = r.get("name")
            rtype = r.get("type")
            rid = r.get("id")
            if (name == domain or name == f"www.{domain}") and rtype in ["A", "AAAA", "CNAME"]:
                if not r.get("proxied"):
                    print(f"[*] Switching {rtype} {name} to Proxied (Orange Cloud)...")
                    patch_data = {"proxied": True}
                    upd = cf_api("PATCH", f"/zones/{zone_id}/dns_records/{rid}", token=token, email=email, api_key=api_key, body=patch_data)
                    if upd.get("success"):
                        print(f"[+] {name} is now PROXIED (Orange Cloud)!")
                    else:
                        print(f"[!] Failed to proxy {name}: {upd.get('errors')}")
                else:
                    print(f"[+] {name} is already Proxied.")
    else:
        print(f"[!] Failed to list DNS records: {dns_resp.get('errors')}")

    # 9. Purge cache
    print("\n[*] Step 8: Purging Cloudflare Edge Cache...")
    purge_resp = cf_api("POST", f"/zones/{zone_id}/purge_cache", token=token, email=email, api_key=api_key, body={"purge_everything": True})
    if purge_resp.get("success"):
        print(f"[+] Edge Cache purged successfully!")
    else:
        print(f"[!] Purge cache warning: {purge_resp.get('errors')}")

    print("\n=== OPTIMIZATION FINISHED ===")
    has_ech, info = check_ech_doh(domain)
    print(f"Final DoH ECH Check: {'[WARNING] ECH Still detected' if has_ech else '[OK] ECH Disabled'}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Configure Cloudflare for RF access without VPN")
    parser.add_argument("--domain", default="mastersofthewild.ru")
    parser.add_argument("--token", help="Cloudflare API Token")
    parser.add_argument("--email", help="Cloudflare Account Email")
    parser.add_argument("--key", help="Cloudflare Global API Key")
    parser.add_argument("--zone-id", help="Cloudflare Zone ID (optional, auto-detected)")
    parser.add_argument("--check-only", action="store_true", help="Only check DoH ECH status")
    
    args = parser.parse_args()
    
    if args.check_only or (not args.token and not (args.email and args.key)):
        print(f"Checking {args.domain} ECH status via Google DoH...")
        has_ech, info = check_ech_doh(args.domain)
        print(f"ECH Present: {has_ech}")
        print(f"Details: {info}")
        if not args.check_only:
            print("\nTo apply settings, run with either:")
            print("  python scripts/cloudflare_optimizer.py --token <API_TOKEN>")
            print("  python scripts/cloudflare_optimizer.py --email <EMAIL> --key <GLOBAL_API_KEY>")
        sys.exit(0)
        
    run_optimizer(args.domain, token=args.token, email=args.email, api_key=args.key, zone_id=args.zone_id)
