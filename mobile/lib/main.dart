import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';

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

  await _initSupabase();

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
      appRunner: () => runApp(const ProviderScope(child: AtmosApp())),
    );
  } else {
    runApp(const ProviderScope(child: AtmosApp()));
  }
}
