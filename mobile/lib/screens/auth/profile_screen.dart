import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../state/auth_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _avatarCtrl = TextEditingController();
  bool _loading = false;
  bool _saved = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _avatarCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final User? user = ref.read(currentUserProvider);
    if (user == null) return;
    try {
      final Map<String, dynamic>? row = await Supabase.instance.client
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
      if (row != null && mounted) {
        _nameCtrl.text = row['display_name']?.toString() ?? '';
        _avatarCtrl.text = row['avatar_url']?.toString() ?? '';
      }
    } catch (_) {}
  }

  Future<void> _save() async {
    final User? user = ref.read(currentUserProvider);
    if (user == null) return;
    setState(() {
      _loading = true;
      _saved = false;
      _error = null;
    });
    try {
      await Supabase.instance.client.from('profiles').update(<String, dynamic>{
        'display_name': _nameCtrl.text.isEmpty ? null : _nameCtrl.text,
        'avatar_url': _avatarCtrl.text.isEmpty ? null : _avatarCtrl.text,
      }).eq('id', user.id);
      if (!mounted) return;
      setState(() => _saved = true);
      Future<void>.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _saved = false);
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final bool ready = ref.watch(supabaseReadyProvider);
    final User? user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: t.bg,
      appBar: AppBar(title: const Text('Profile')),
      body: AtmosphericBackground(
        child: SafeArea(
          child: !ready || user == null
              ? Center(
                  child: Text('Sign in to edit your profile.',
                      style: AtmosTypography.label(fontSize: 14, color: t.textMuted)),
                )
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      TextField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Display name',
                          prefixIcon: Icon(LucideIcons.user),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _avatarCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Avatar URL',
                          prefixIcon: Icon(LucideIcons.image),
                        ),
                        keyboardType: TextInputType.url,
                      ),
                      if (_error != null) ...<Widget>[
                        const SizedBox(height: 8),
                        Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                      ],
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: t.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _loading ? null : _save,
                        icon: _loading
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Icon(_saved ? LucideIcons.check : LucideIcons.save, size: 16),
                        label: Text(_loading ? 'Saving…' : _saved ? 'Saved' : 'Save'),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
