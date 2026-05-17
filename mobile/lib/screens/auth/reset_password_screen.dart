import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../state/auth_provider.dart';

/// Two screens in one:
///  - `mode='request'`: enter email → Supabase emails a reset link
///  - `mode='update'`: set a new password (entered after the user
///    clicks the email link which deep-links via
///    `com.atmos.app://login-callback?type=recovery&…`)
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, this.mode = 'request'});

  /// 'request' | 'update'
  final String mode;

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      await Supabase.instance.client.auth.resetPasswordForEmail(
        _emailCtrl.text.trim(),
        redirectTo: 'com.atmos.app://login-callback',
      );
      if (mounted) {
        setState(() {
          _sent = true;
          _info = 'Check your inbox for the reset link.';
        });
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _update() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(password: _passwordCtrl.text),
      );
      if (mounted) Navigator.of(context).maybePop();
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
    final bool isUpdate = widget.mode == 'update';
    final bool ready = ref.watch(supabaseReadyProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(isUpdate ? 'Set new password' : 'Reset password'),
      ),
      body: SafeArea(
        child: !ready
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Auth not configured.'),
                ),
              )
            : Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      const SizedBox(height: 12),
                      if (isUpdate)
                        TextFormField(
                          controller: _passwordCtrl,
                          decoration: const InputDecoration(
                            labelText: 'New password',
                            prefixIcon: Icon(Icons.lock_outline),
                          ),
                          obscureText: true,
                          autofillHints: const <String>[AutofillHints.newPassword],
                          validator: (String? v) =>
                              (v == null || v.length < 6) ? 'Min 6 chars' : null,
                        )
                      else
                        TextFormField(
                          controller: _emailCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email_outlined),
                          ),
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const <String>[AutofillHints.email],
                          validator: (String? v) {
                            if (v == null || v.trim().isEmpty) return 'Required';
                            if (!v.contains('@')) return 'Invalid email';
                            return null;
                          },
                        ),
                      if (_error != null) ...<Widget>[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                      ],
                      if (_info != null) ...<Widget>[
                        const SizedBox(height: 12),
                        Text(_info!,
                            style: TextStyle(color: Theme.of(context).primaryColor)),
                      ],
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _loading || _sent
                            ? null
                            : (isUpdate ? _update : _request),
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text(isUpdate
                                ? 'Save password'
                                : (_sent ? 'Sent — check your inbox' : 'Send reset link')),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
