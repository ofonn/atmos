import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'state/storage.dart';

Future<void> _initSupabase() async {
  const supaUrl = String.fromEnvironment('SUPABASE_URL');
  const supaKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  if (supaUrl.isEmpty || supaKey.isEmpty) return;
  try {
    Supabase.instance.client; // throws if not initialized
  } catch (_) {
    await Supabase.initialize(url: supaUrl, anonKey: supaKey);
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(<DeviceOrientation>[
    DeviceOrientation.portraitUp,
  ]);

  // Load SharedPreferences here so we can override sharedPrefsProvider at the
  // top-level ProviderScope. Nested-scope overrides don't reach providers
  // accessed from sibling consumers, which left the app on a blank screen.
  final SharedPreferences prefs = await SharedPreferences.getInstance();

  await _initSupabase();

  final List<Override> overrides = <Override>[
    sharedPrefsProvider.overrideWithValue(prefs),
  ];

  const sentryDsn = String.fromEnvironment('SENTRY_DSN');
  if (sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (SentryFlutterOptions options) {
        options.dsn = sentryDsn;
        options.environment = const String.fromEnvironment(
          'SENTRY_ENV',
          defaultValue: 'production',
        );
        // 100% errors; 10% traces in prod (tune later via tracesSampler).
        options.tracesSampleRate = 0.1;
      },
      appRunner: () => runApp(ProviderScope(
        overrides: overrides,
        child: const AtmosApp(),
      )),
    );
  } else {
    runApp(ProviderScope(
      overrides: overrides,
      child: const AtmosApp(),
    ));
  }
}
