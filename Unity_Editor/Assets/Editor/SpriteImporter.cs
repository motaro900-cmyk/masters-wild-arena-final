using UnityEngine;
using UnityEditor;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;

public class SpriteImporter : EditorWindow {
    [MenuItem("Tools/Slice Sprite from JSON")]
    public static void Slice() {
        Object selected = Selection.activeObject;
        if (selected == null || !(selected is Texture2D)) {
            Debug.LogError("🛸 [SpriteImporter] Сначала выбери файл PNG в окне Project!");
            return;
        }

        string path = AssetDatabase.GetAssetPath(selected);
        string jsonPath = path.Replace(".png", ".json");

        if (!File.Exists(jsonPath)) {
            Debug.LogError("🛸 [SpriteImporter] JSON файл не найден!");
            return;
        }

        string jsonText = File.ReadAllText(jsonPath);
        
        TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
        importer.spriteImportMode = SpriteImportMode.Multiple;
        importer.textureType = TextureImporterType.Sprite;

        int texWidth = 0;
        int texHeight = 0;
        GetTextureSize(importer, out texWidth, out texHeight);

        List<SpriteMetaData> metas = new List<SpriteMetaData>();
        string pattern = "\"([^\"]+)\"\\s*:\\s*\\{\\s*\"frame\"\\s*:\\s*\\{\\s*\"x\"\\s*:\\s*(\\d+)\\s*,\\s*\"y\"\\s*:\\s*(\\d+)\\s*,\\s*\"w\"\\s*:\\s*(\\d+)\\s*,\\s*\"h\"\\s*:\\s*(\\d+)";
        MatchCollection matches = Regex.Matches(jsonText, pattern);

        foreach (Match m in matches) {
            string name = m.Groups[1].Value.Replace(".png", "");
            float x = float.Parse(m.Groups[2].Value);
            float y = float.Parse(m.Groups[3].Value);
            float w = float.Parse(m.Groups[4].Value);
            float h = float.Parse(m.Groups[5].Value);

            SpriteMetaData meta = new SpriteMetaData();
            meta.name = name;
            meta.rect = new Rect(x, texHeight - y - h, w, h);
            meta.alignment = (int)SpriteAlignment.Center;
            meta.pivot = new Vector2(0.5f, 0.5f);
            metas.Add(meta);
        }

        #pragma warning disable 0618
        importer.spritesheet = metas.ToArray();
        #pragma warning restore 0618
        
        AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate);
        Debug.Log("🛸 [SpriteImporter] Успешно нарезано спрайтов: " + metas.Count);
        EditorUtility.DisplayDialog("Success", "Sliced " + metas.Count + " sprites!", "OK");
    }

    private static void GetTextureSize(TextureImporter importer, out int width, out int height) {
        System.Type type = typeof(TextureImporter);
        System.Reflection.MethodInfo method = type.GetMethod("GetWidthAndHeight", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        object[] args = new object[] { 0, 0 };
        method.Invoke(importer, args);
        width = (int)args[0];
        height = (int)args[1];
    }
}
