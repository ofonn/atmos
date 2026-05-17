# App icon

Drop two PNGs in this directory before generating launcher icons:

| File | Spec |
|---|---|
| `app_icon.png` | 1024×1024, full bleed. Used for the iOS-style square icon and the adaptive icon background fallback. |
| `app_icon_foreground.png` | 1024×1024 with ~33% transparent padding around the foreground motif. Used for the Android 8+ adaptive icon foreground. |

Then generate:

```bash
flutter pub run flutter_launcher_icons
```

This populates `android/app/src/main/res/mipmap-*/`.
