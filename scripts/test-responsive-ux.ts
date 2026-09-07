/**
 * Phase 16: Automated Responsive Mobile-First UX & Accessibility Verification Suite
 * Validates CSS tokens, safe area insets, touch target dimensions, ARIA landmarks,
 * viewport meta declarations, and mobile responsiveness rules across the codebase.
 */

import * as fs from 'fs';
import * as path from 'path';

function runResponsiveUxTests() {
  console.log('================================================================');
  console.log('🧪 PHASE 16: RESPONSIVE MOBILE-FIRST UX & ACCESSIBILITY TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Check globals.css
  console.log('1. Validating app/globals.css tokens & utilities:');
  const globalsCssPath = path.join(process.cwd(), 'app', 'globals.css');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

  assert(globalsCss.includes('overflow-x: hidden;'), 'Body overflow-x: hidden enforced');
  assert(globalsCss.includes('touch-action: manipulation;'), 'touch-action: manipulation prevents double-tap zoom delay');
  assert(globalsCss.includes('.safe-bottom'), 'Safe area bottom inset utility defined');
  assert(globalsCss.includes('env(safe-area-inset-bottom'), 'env(safe-area-inset-bottom) utilized');
  assert(globalsCss.includes('.touch-target'), 'Accessible touch target (44px min) utility defined');
  assert(globalsCss.includes('.touch-target-lg'), 'Accessible large touch target (48px min) utility defined');
  assert(globalsCss.includes('*:focus-visible'), 'WCAG 2.1 AA focus-visible outline ring defined');
  assert(globalsCss.includes('.table-scroll-container'), 'Responsive table smooth scrolling container defined');

  // 2. Check layout.tsx
  console.log('\n2. Validating app/layout.tsx viewport and accessibility:');
  const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
  const layout = fs.readFileSync(layoutPath, 'utf8');

  assert(layout.includes('viewportFit: "cover"') || layout.includes("viewportFit: 'cover'"), 'ViewportFit cover configured for notch/island devices');
  assert(layout.includes('width: "device-width"') || layout.includes("width: 'device-width'"), 'Device width viewport defined');
  assert(layout.includes('overflow-x-hidden'), 'Root layout enforces overflow-x-hidden');
  assert(layout.includes('appleWebApp'), 'Apple Web App PWA metadata declared');

  // 3. Check citizen-header.tsx
  console.log('\n3. Validating components/citizen/citizen-header.tsx:');
  const headerPath = path.join(process.cwd(), 'components', 'citizen', 'citizen-header.tsx');
  const header = fs.readFileSync(headerPath, 'utf8');

  assert(header.includes('aria-label="Toggle navigation menu"'), 'Mobile hamburger trigger has accessible aria-label');
  assert(header.includes('aria-expanded={mobileMenuOpen}'), 'Mobile drawer state bound to aria-expanded');
  assert(header.includes('aria-controls="mobile-nav-drawer"'), 'Mobile drawer has aria-controls linkage');
  assert(header.includes('touch-target'), 'Header triggers use touch-target sizing');

  // 4. Check bottom-nav.tsx
  console.log('\n4. Validating components/citizen/bottom-nav.tsx:');
  const bottomNavPath = path.join(process.cwd(), 'components', 'citizen', 'bottom-nav.tsx');
  const bottomNav = fs.readFileSync(bottomNavPath, 'utf8');

  assert(bottomNav.includes('role="navigation"'), 'Bottom navigation has semantic role');
  assert(bottomNav.includes('aria-label="Mobile Bottom Navigation"'), 'Bottom nav has descriptive aria-label');
  assert(bottomNav.includes('safe-bottom') || bottomNav.includes('safe-area-inset-bottom'), 'Bottom nav includes safe-area bottom inset padding');
  assert(bottomNav.includes('touch-target'), 'Bottom nav items utilize touch-target sizing');

  // 5. Check submit-issue/page.tsx
  console.log('\n5. Validating app/submit-issue/page.tsx:');
  const submitPagePath = path.join(process.cwd(), 'app', 'submit-issue', 'page.tsx');
  const submitPage = fs.readFileSync(submitPagePath, 'utf8');

  assert(submitPage.includes('CitizenBottomNav'), 'Submit issue page includes mobile bottom navigation');
  assert(submitPage.includes('VoiceAssistantModal'), 'Submit issue page includes voice accessibility modal');
  assert(submitPage.includes('pb-20 sm:pb-8'), 'Submit issue page includes safe bottom spacing on mobile');

  // 6. Check track pages
  console.log('\n6. Validating app/track and track/[id] pages:');
  const trackPath = path.join(process.cwd(), 'app', 'track', 'page.tsx');
  const trackPage = fs.readFileSync(trackPath, 'utf8');
  assert(trackPage.includes('CitizenBottomNav'), 'Track search page includes mobile bottom navigation');
  assert(trackPage.includes('VoiceAssistantModal'), 'Track search page includes Voice Assistant shortcut');

  const trackDetailPath = path.join(process.cwd(), 'app', 'track', '[id]', 'page.tsx');
  const trackDetail = fs.readFileSync(trackDetailPath, 'utf8');
  assert(trackDetail.includes('CitizenBottomNav'), 'Track detail page includes mobile bottom navigation');
  assert(trackDetail.includes('ComplaintTimeline'), 'Track detail page includes responsive timeline');

  // 7. Check field worker dashboard
  console.log('\n7. Validating app/dashboard/field-worker/page.tsx:');
  const fieldWorkerPath = path.join(process.cwd(), 'app', 'dashboard', 'field-worker', 'page.tsx');
  const fieldWorker = fs.readFileSync(fieldWorkerPath, 'utf8');

  assert(fieldWorker.includes('touch-target-lg'), 'Field worker primary actions use 48px+ touch-target-lg');
  assert(fieldWorker.includes('Directions'), 'Field worker includes quick GPS navigation directions');
  assert(fieldWorker.includes('table-scroll-container'), 'Field worker tabs use smooth scrolling wrapper');

  // 8. Check reports and predictive pages
  console.log('\n8. Validating app/reports and app/predictive pages:');
  const reportsPath = path.join(process.cwd(), 'app', 'reports', 'page.tsx');
  const reports = fs.readFileSync(reportsPath, 'utf8');
  assert(reports.includes('CitizenBottomNav'), 'Reports portal includes mobile bottom navigation');

  const predictivePath = path.join(process.cwd(), 'app', 'predictive', 'page.tsx');
  const predictive = fs.readFileSync(predictivePath, 'utf8');
  assert(predictive.includes('CitizenBottomNav'), 'Predictive AI portal includes mobile bottom navigation');

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runResponsiveUxTests();
