import 'package:flutter_test/flutter_test.dart';

import 'package:infranex_ai/main.dart';

void main() {
  testWidgets('App initialization smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that the INFRANEX AI title is rendered.
    expect(find.text('INFRANEX AI'), findsWidgets);
  });
}

