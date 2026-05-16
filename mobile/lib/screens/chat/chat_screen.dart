import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../../api/models/ai_content.dart';
import '../../state/chat_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';
import '../../widgets/gradient_text.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});
  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _input = TextEditingController();
  final FocusNode _focus = FocusNode();
  final ScrollController _scroll = ScrollController();
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _listening = false;

  @override
  void dispose() {
    _input.dispose();
    _focus.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send([String? text]) async {
    final String content = (text ?? _input.text).trim();
    if (content.isEmpty) return;
    _input.clear();
    await ref.read(chatProvider.notifier).sendMessage(content);
    _scrollToEnd();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 200,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _toggleMic() async {
    if (_listening) {
      await _speech.stop();
      setState(() => _listening = false);
      return;
    }
    final bool ok = await _speech.initialize();
    if (!ok) return;
    setState(() => _listening = true);
    HapticFeedback.lightImpact();
    _speech.listen(onResult: (result) {
      _input.text = result.recognizedWords;
      _input.selection = TextSelection.fromPosition(TextPosition(offset: _input.text.length));
      if (result.finalResult) {
        setState(() => _listening = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final ChatState chat = ref.watch(chatProvider);
    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: Column(
            children: <Widget>[
              _header(),
              Expanded(
                child: chat.messages.isEmpty ? _empty() : _thread(chat),
              ),
              _inputBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header() {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
      child: Row(
        children: <Widget>[
          IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
          GradientText(
            'Atmos AI',
            style: AtmosTypography.headline(fontSize: 20, fontWeight: FontWeight.w700),
            gradient: LinearGradient(colors: <Color>[t.gradientTextFrom, t.gradientTextTo]),
          ),
          const Spacer(),
          IconButton(
            icon: Icon(LucideIcons.moreHorizontal, color: t.text),
            onPressed: () => _menu(),
          ),
        ],
      ),
    );
  }

  Widget _empty() {
    final AtmosTokens t = context.atmos;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AtmosColors.heroGradient,
                boxShadow: <BoxShadow>[
                  BoxShadow(color: AtmosColors.heroGradientStart.withOpacity(0.4), blurRadius: 24),
                ],
              ),
              child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 16),
            Text('Ask Atmos anything', style: AtmosTypography.headline(fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
            const SizedBox(height: 6),
            Text('Weather, planning, what to wear — it has the live forecast.',
                style: AtmosTypography.body(fontSize: 13, color: t.textMuted), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: quickPrompts.map((String p) {
                return GestureDetector(
                  onTap: () => _send(p),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: t.surface,
                      borderRadius: BorderRadius.circular(40),
                      border: Border.all(color: t.outline.withOpacity(0.5)),
                    ),
                    child: Text(p,
                        style: AtmosTypography.label(fontSize: 12, color: t.text)),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _thread(ChatState chat) {
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      itemCount: chat.messages.length + (chat.sending ? 1 : 0),
      itemBuilder: (BuildContext context, int i) {
        if (i == chat.messages.length) return _typing();
        return _bubble(chat.messages[i]);
      },
    );
  }

  Widget _bubble(ChatMessage m) {
    final AtmosTokens t = context.atmos;
    final bool user = m.role == 'user';
    return Align(
      alignment: user ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        decoration: BoxDecoration(
          gradient: user
              ? null
              : LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: <Color>[t.surface, t.surface.withOpacity(0.75)],
                ),
          color: user ? null : null,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(user ? 20 : 6),
            bottomRight: Radius.circular(user ? 6 : 20),
          ),
          border: user ? Border.all(color: t.outline.withOpacity(0.5)) : null,
        ),
        child: user
            ? Text(m.content, style: AtmosTypography.body(fontSize: 14, color: t.text))
            : MarkdownBody(
                data: m.content,
                styleSheet: MarkdownStyleSheet(
                  p: AtmosTypography.body(fontSize: 14, color: t.text, height: 1.5),
                  strong: AtmosTypography.body(fontSize: 14, color: t.text, fontWeight: FontWeight.w700),
                  em: AtmosTypography.body(fontSize: 14, color: t.text, height: 1.5),
                  listBullet: AtmosTypography.body(fontSize: 14, color: t.textMuted),
                ),
              ),
      ),
    );
  }

  Widget _typing() {
    final AtmosTokens t = context.atmos;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            for (int i = 0; i < 3; i++)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 2),
                child: _Dot(delay: Duration(milliseconds: 120 * i)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _inputBar() {
    final AtmosTokens t = context.atmos;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: t.outline.withOpacity(0.5)),
          ),
          child: Row(
            children: <Widget>[
              IconButton(
                icon: Icon(
                  _listening ? LucideIcons.micOff : LucideIcons.mic,
                  color: _listening ? AtmosColors.danger : t.textMuted,
                ),
                onPressed: _toggleMic,
              ),
              Expanded(
                child: TextField(
                  controller: _input,
                  focusNode: _focus,
                  minLines: 1,
                  maxLines: 5,
                  style: TextStyle(color: t.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Ask anything about the weather…',
                    hintStyle: TextStyle(color: t.textMuted),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                ),
              ),
              GestureDetector(
                onTap: _send,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AtmosColors.heroGradient,
                    boxShadow: <BoxShadow>[
                      BoxShadow(color: AtmosColors.heroGradientStart.withOpacity(0.4), blurRadius: 16),
                    ],
                  ),
                  child: const Icon(LucideIcons.send, color: Colors.white, size: 18),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _menu() {
    final AtmosTokens t = context.atmos;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: t.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            ListTile(
              leading: Icon(LucideIcons.copy, color: t.text),
              title: Text('Copy last reply', style: TextStyle(color: t.text)),
              onTap: () {
                final ChatState s = ref.read(chatProvider);
                final ChatMessage? last = s.messages.reversed
                    .where((m) => m.role == 'assistant')
                    .firstOrNull;
                if (last != null) {
                  Clipboard.setData(ClipboardData(text: last.content));
                }
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: Icon(LucideIcons.trash2, color: AtmosColors.danger),
              title: Text('Clear chat', style: TextStyle(color: AtmosColors.danger)),
              onTap: () {
                ref.read(chatProvider.notifier).clear();
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  const _Dot({required this.delay});
  final Duration delay;
  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 800),
  );

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(widget.delay, () {
      if (mounted) _c.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.3, end: 1).animate(_c),
      child: Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: context.atmos.primary,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull {
    final Iterator<T> it = iterator;
    return it.moveNext() ? it.current : null;
  }
}
