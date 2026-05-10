using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using System.Linq;

public class MasterHUDBuilder : EditorWindow {
    public enum UIAnchor { TopLeft, TopRight, BottomCenter, RightCenter, Stretch, Center }

    [MenuItem("Tools/🚀 BUILD COMPLETE HUD")]
    public static void Build() {
        GameObject oldCanvas = GameObject.Find("Canvas");
        if (oldCanvas != null) DestroyImmediate(oldCanvas);

        GameObject canvasObj = new GameObject("Canvas");
        Canvas canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasObj.AddComponent<GraphicRaycaster>();
        
        CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);
        scaler.matchWidthOrHeight = 0.5f;

        // 1. ФОН (Растягивается на весь экран, Z-Index = 0)
        CreateSmartElement(canvasObj.transform, "Background", "Bg_main", UIAnchor.Stretch, 0, 0, 0, 0);

        // 2. ВЕРХНЯЯ ЛЕВАЯ ПАНЕЛЬ (Аватар) - привязка к левому верхнему углу
        GameObject avatar = CreateSmartElement(canvasObj.transform, "topbar-avatar", "profile_plate", UIAnchor.TopLeft, 20, -20, 400, 130);

        // 3. ВЕРХНЯЯ ПРАВАЯ ПАНЕЛЬ (Ресурсы) - привязка к правому верхнему углу со сдвигом
        GameObject resBar = CreateSmartElement(canvasObj.transform, "topbar-res", "social_bar_bg", UIAnchor.TopRight, -150, -20, 500, 90);
        // Иконки ресурсов внутри панели (позиции относительно центра панели)
        CreateSmartElement(resBar.transform, "icon-gold", "gold", UIAnchor.Center, -150, 0, 70, 70);
        CreateSmartElement(resBar.transform, "icon-gem", "gem", UIAnchor.Center, 50, 0, 70, 70);

        // 4. БОКОВАЯ ПАНЕЛЬ (ПРАВО) - привязка к центру правого края
        CreateSmartElement(canvasObj.transform, "right-sidebar", "parch", UIAnchor.RightCenter, -20, 0, 300, 750);

        // 5. НИЖНЯЯ КНОПКА (БОЙ) - привязка к низу по центру
        CreateSmartElement(canvasObj.transform, "bottom-center", "btn_battle", UIAnchor.BottomCenter, 0, 40, 400, 160);
        
        // 6. КНОПКА НАСТРОЕК (Крайний правый верхний угол)
        CreateSmartElement(canvasObj.transform, "btn-settings", "settings", UIAnchor.TopRight, -20, -20, 90, 90);

        Selection.activeGameObject = canvasObj;
        Debug.Log("🚀 [MasterBuilder] HUD собран по стандартам PRO! Адаптивные якоря (Anchors) настроены.");
    }

    private static GameObject CreateSmartElement(Transform parent, string id, string searchName, UIAnchor anchor, float x, float y, float w, float h) {
        GameObject go = new GameObject(id);
        go.transform.SetParent(parent, false);
        Image img = go.AddComponent<Image>();

        string[] guids = AssetDatabase.FindAssets(searchName);
        if (guids.Length > 0) {
            string path = AssetDatabase.GUIDToAssetPath(guids[0]);
            Object[] assets = AssetDatabase.LoadAllAssetsAtPath(path);
            Sprite spr = assets.OfType<Sprite>().FirstOrDefault();
            if (spr != null) {
                img.sprite = spr;
                img.color = Color.white;
                img.preserveAspect = true;
            }
        } else {
            // Графическая заглушка (Fallback), если ассет не найден
            img.color = new Color(1, 1, 1, 0.3f);
        }

        RectTransform rect = go.GetComponent<RectTransform>();
        SetAnchor(rect, anchor);

        if (anchor == UIAnchor.Stretch) {
            rect.sizeDelta = Vector2.zero; // Обнуляем отступы от краев
            rect.anchoredPosition = Vector2.zero;
            go.transform.SetAsFirstSibling();
            img.preserveAspect = false; 
        } else {
            rect.anchoredPosition = new Vector2(x, y);
            rect.sizeDelta = new Vector2(w, h);
        }
        
        return go;
    }

    private static void SetAnchor(RectTransform rect, UIAnchor anchor) {
        switch (anchor) {
            case UIAnchor.TopLeft:
                rect.anchorMin = new Vector2(0, 1);
                rect.anchorMax = new Vector2(0, 1);
                rect.pivot = new Vector2(0, 1);
                break;
            case UIAnchor.TopRight:
                rect.anchorMin = new Vector2(1, 1);
                rect.anchorMax = new Vector2(1, 1);
                rect.pivot = new Vector2(1, 1);
                break;
            case UIAnchor.BottomCenter:
                rect.anchorMin = new Vector2(0.5f, 0);
                rect.anchorMax = new Vector2(0.5f, 0);
                rect.pivot = new Vector2(0.5f, 0);
                break;
            case UIAnchor.RightCenter:
                rect.anchorMin = new Vector2(1, 0.5f);
                rect.anchorMax = new Vector2(1, 0.5f);
                rect.pivot = new Vector2(1, 0.5f);
                break;
            case UIAnchor.Stretch:
                rect.anchorMin = new Vector2(0, 0);
                rect.anchorMax = new Vector2(1, 1);
                rect.pivot = new Vector2(0.5f, 0.5f);
                break;
            case UIAnchor.Center:
            default:
                rect.anchorMin = new Vector2(0.5f, 0.5f);
                rect.anchorMax = new Vector2(0.5f, 0.5f);
                rect.pivot = new Vector2(0.5f, 0.5f);
                break;
        }
    }
}
