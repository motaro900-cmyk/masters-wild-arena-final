using UnityEngine;
using UnityEditor;
using System.IO;

public class ListAssets : EditorWindow {
    [MenuItem("Tools/🔍 List All UI Assets")]
    public static void List() {
        Debug.Log("--- СПИСОК ВСЕХ ФАЙЛОВ В ASSETS/UI ---");
        string path = "Assets/UI";
        if (Directory.Exists(path)) {
            string[] files = Directory.GetFiles(path);
            foreach (string file in files) {
                if (!file.EndsWith(".meta")) {
                    Debug.Log("Нашел файл: " + file);
                }
            }
        } else {
            Debug.LogError("Папка Assets/UI не найдена!");
        }
    }
}
