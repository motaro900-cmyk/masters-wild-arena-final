using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using System.Collections.Generic;

public class LayoutImporter : EditorWindow {
    private string jsonInput = "";

    [MenuItem("Tools/Import UI from Web")]
    public static void ShowWindow() {
        GetWindow<LayoutImporter>("UI Importer");
    }

    void OnGUI() {
        GUILayout.Label("Вставь JSON из игры ниже:"); // Убрал EditorStyles.boldLabel
        jsonInput = EditorGUILayout.TextArea(jsonInput, GUILayout.Height(200));

        if (GUILayout.Button("Импортировать в сцену")) {
            ImportLayout(jsonInput);
        }
    }

    private void ImportLayout(string json) {
        Canvas canvas = Object.FindFirstObjectByType<Canvas>();
        if (canvas == null) {
            EditorUtility.DisplayDialog("Error", "Сначала создай Canvas в сцене!", "OK");
            return;
        }

        // Получаем референсное разрешение (чтобы избавиться от хардкода 1920x1080)
        CanvasScaler scaler = canvas.GetComponent<CanvasScaler>();
        float refWidth = scaler != null ? scaler.referenceResolution.x : 1920f;
        float refHeight = scaler != null ? scaler.referenceResolution.y : 1080f;

        LayoutData data = null;
        try {
            string safeJson = json.Trim();
            if (safeJson.StartsWith("[")) {
                safeJson = "{\"items\":" + safeJson + "}";
            }
            data = JsonUtility.FromJson<LayoutData>(safeJson);
        } catch (System.Exception e) {
            EditorUtility.DisplayDialog("Error", $"Ошибка парсинга JSON:\n{e.Message}", "OK");
            return;
        }

        if (data == null || data.items == null || data.items.Count == 0) {
            EditorUtility.DisplayDialog("Error", "Неверный формат JSON", "OK");
            return;
        }

        foreach (var item in data.items) {
            GameObject go = GameObject.Find(item.id);
            if (go == null) {
                go = new GameObject(item.id);
                go.transform.SetParent(canvas.transform, false);
                go.AddComponent<Image>();
            }

            RectTransform rect = go.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.pivot = new Vector2(0.5f, 0.5f);

            // Математика относительно центра экрана на основе CanvasScaler
            float unityX = item.x - (refWidth * 0.5f);
            float unityY = (refHeight * 0.5f) - item.y;

            rect.anchoredPosition = new Vector2(unityX, unityY);
            rect.sizeDelta = new Vector2(item.width > 0 ? item.width : 100, item.height > 0 ? item.height : 100);
        }

        EditorUtility.DisplayDialog("Success", $"Импортировано {data.items.Count} элементов!", "OK");
    }

    [System.Serializable]
    public class LayoutData {
        public List<LayoutItem> items;
    }

    [System.Serializable]
    public class LayoutItem {
        public string id;
        public float x;
        public float y;
        public float width;
        public float height;
    }
}
