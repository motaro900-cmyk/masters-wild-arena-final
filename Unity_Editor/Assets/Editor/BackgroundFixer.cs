using UnityEngine;
using UnityEditor;
using UnityEngine.UI;

public class BackgroundFixer : EditorWindow {
    [MenuItem("Tools/Fix Background")]
    public static void Fix() {
        GameObject bgObj = GameObject.Find("Background");
        if (bgObj == null) {
            Debug.LogError("🛸 [Fixer] Объект 'Background' не найден!");
            return;
        }

        string assetPath = "Assets/UI/bg_main.png";
        // Принудительно импортируем как спрайт
        TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
        if (importer != null) {
            importer.textureType = TextureImporterType.Sprite;
            importer.mipmapEnabled = false;
            importer.filterMode = FilterMode.Bilinear;
            AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
        }

        Sprite bgSprite = AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);
        Image img = bgObj.GetComponent<Image>();
        if (img != null && bgSprite != null) {
            img.sprite = bgSprite;
            img.color = Color.white;
            Debug.Log("🛸 [Fixer] Фон успешно применен!");
        } else {
            Debug.LogError("🛸 [Fixer] Не удалось загрузить спрайт или найти компонент Image");
        }
    }
}
