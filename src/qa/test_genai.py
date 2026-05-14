# 需要安装: pip install google-generativeai
import google.generativeai as genai

# 使用 Antigravity 代理地址 (推荐 127.0.0.1)
genai.configure(
    api_key="sk-baa5d98f474f4d8c8564e59e6f067da8",
    transport='rest',
    client_options={'api_endpoint': 'http://127.0.0.1:8045'}
)

model = genai.GenerativeModel('gemini-3-flash')
try:
    response = model.generate_content("Hello")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
