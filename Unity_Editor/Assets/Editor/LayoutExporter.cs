using UnityEngine;
using UnityEditor;
using System.IO;
using System.Collections.Generic;

public class LayoutExporter : EditorWindow {
    [MenuItem("Tools/Export UI for Web")]
    public static void Export() {
        var layout = new LayoutWrapper();
        layout.items = new List<UIData>();
        
        foreach (GameObject obj in Selection.gameObjects) {
            var rt = obj.GetComponent<RectTransform>();
            if (rt == null) continue;

            layout.items.Add(new UIData {
                id = obj.name,
                x = rt.anchoredPosition.x,
                y = rt.anchoredPosition.y,
                width = rt.sizeDelta.x,
                height = rt.sizeDelta.y
            });
        }

        string json = JsonUtility.ToJson(layout, true);
        GUIUtility.systemCopyBuffer = json;
        
        EditorUtility.DisplayDialog("Success", 
            "Координаты " + layout.items.Count + " объектов скопированы в буфер обмена!", "OK");
    }

    [System.Serializable]
    public class UIData {
        public string id;
        public float x;
        public float y;
        public float width;
        public float height;
    }

    [System.Serializable]
    public class LayoutWrapper {
        public List<UIData> items;
    }
}
