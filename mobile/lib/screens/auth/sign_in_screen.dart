import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../state/auth_provider.dart';

/// Email/password sign-in & sign-up screen. Mirrors the web app's /sign-in
/// and /sign-up routes. Google OAuth is exposed but requires the
/// Supabase project's deep-link to be configured in AndroidManifest.xml.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isSignUp = false;
  bool _loading = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final auth = Supabase.instance.client.auth;
      if (_isSignUp) {
        await auth.signUp(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
        );
        setState(() => _info = 'Check your inbox to confirm.');
      } else {
        await auth.signInWithPassword(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
        );
        if (mounted) Navigator.of(context).maybePop();
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'com.atmos.app://login-callback',
      );
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ready = ref.watch(supabaseReadyProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isSignUp ? 'Create account' : 'Sign in'),
      ),
      body: SafeArea(
        child: !ready
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'Auth not configured — build with --dart-define SUPABASE_URL=... SUPABASE_ANON_KEY=...',
                    textAlign: TextAlign.center,
                  ),
                ),
              )
            : Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _emailCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Required';
                          if (!v.contains('@')) return 'Invalid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        obscureText: true,
                        autofillHints: _isSignUp
                            ? const [AutofillHints.newPassword]
                            : const [AutofillHints.password],
                        validator: (v) {
                          if (v == null || v.length < 6) return 'Min 6 chars';
                          return null;
                        },
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!,
                            style: const TextStyle(color: Colors.redAccent)),
                      ],
                      if (_info != null) ...[
                        const SizedBox(height: 12),
                        Text(_info!,
                            style:
                                TextStyle(color: Theme.of(context).primaryColor)),
                      ],
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text(_isSignUp ? 'Create account' : 'Sign in'),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _loading ? null : _signInWithGoogle,
                        icon: const Icon(Icons.login),
                        label: const Text('Continue with Google'),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() {
                                  _isSignUp = !_isSignUp;
                                  _error = null;
                                  _info = null;
                                }),
                        child: Text(_isSignUp
                            ? 'Have an account? Sign in'
                            : 'Need an account? Sign up'),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
