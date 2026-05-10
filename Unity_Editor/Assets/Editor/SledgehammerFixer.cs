using UnityEngine;
using UnityEditor;
using System.IO;

public class SledgehammerFixer : EditorWindow {
    [MenuItem("Tools/🔨 SLEDGEHAMMER FIX")]
    public static void ForceFix() {
        string path = "Assets/UI";
        if (!Directory.Exists(path)) path = "Assets";

        string[] files = Directory.GetFiles(path, "*.*", SearchOption.AllDirectories);
        int count = 0;

        try {
            AssetDatabase.StartAssetEditing();
            foreach (string file in files) {
                if (file.EndsWith(".png") || file.EndsWith(".jpg")) {
                    TextureImporter importer = AssetImporter.GetAtPath(file) as TextureImporter;
                    if (importer != null) {
                        importer.textureType = TextureImporterType.Sprite;
                        importer.spriteImportMode = SpriteImportMode.Single; // ГЛАВНОЕ ТУТ
                        importer.mipmapEnabled = false;
                        importer.SaveAndReimport();
                        count++;
                    }
                }
            }
        } finally {
            AssetDatabase.StopAssetEditing();
        }

        AssetDatabase.Refresh();
        EditorUtility.DisplayDialog("Success", $"🔨 Кувалда сработала! Исправлено {count} файлов. Теперь жми Build HUD!", "OK");
    }
}
