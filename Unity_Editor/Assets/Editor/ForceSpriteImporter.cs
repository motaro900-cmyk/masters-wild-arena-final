using UnityEngine;
using UnityEditor;

public class ForceSpriteImporter : EditorWindow {
    [MenuItem("Tools/🛠️ CONVERT ALL TO SPRITES")]
    public static void Convert() {
        // Ищем все текстуры в проекте
        string[] guids = AssetDatabase.FindAssets("t:texture");
        int count = 0;

        try {
            AssetDatabase.StartAssetEditing();
            foreach (string guid in guids) {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                
                // Нам нужны только те, что лежат в папке Assets (не в пакетах)
                if (path.StartsWith("Assets/")) {
                    TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
                    if (importer != null && importer.textureType != TextureImporterType.Sprite) {
                        importer.textureType = TextureImporterType.Sprite;
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
        EditorUtility.DisplayDialog("Success", $"Найдено и конвертировано {count} файлов!", "OK");
    }
}
