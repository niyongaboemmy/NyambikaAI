/**
 * PWA Debug Utility
 * 
 * Helps diagnose why the PWA install prompt might not be showing.
 * Run in browser console: window.debugPWA()
 */

export const debugPWA = () => {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // 1. Check if running in browser
  results.checks.inBrowser = typeof window !== 'undefined';

  if (!results.checks.inBrowser) {
    console.log('❌ Not running in browser context');
    return results;
  }

  // 2. Check if HTTPS (required for PWA)
  results.checks.isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  
  // 3. Check if already installed
  results.checks.isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://');

  // 4. Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  results.checks.hasManifestLink = !!manifestLink;
  results.checks.manifestHref = manifestLink ? manifestLink.getAttribute('href') : null;

  // 5. Check service worker
  results.checks.hasServiceWorker = 'serviceWorker' in navigator;
  results.checks.serviceWorkerRegistered = false;
  
  if (results.checks.hasServiceWorker) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      results.checks.serviceWorkerRegistered = registrations.length > 0;
      results.checks.serviceWorkerCount = registrations.length;
    });
  }

  // 6. Check dismissal status
  const dismissedDate = localStorage.getItem('pwa-prompt-dismissed');
  results.checks.wasDismissed = !!dismissedDate;
  if (dismissedDate) {
    const daysSince = Math.floor((Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24));
    results.checks.daysSinceDismissal = daysSince;
    results.checks.dismissalExpired = daysSince >= 7;
  }

  // 7. Platform detection
  results.platform = {
    userAgent: navigator.userAgent,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.userAgent.includes('Mac') && 'ontouchend' in document),
    isAndroid: /android/i.test(navigator.userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isChrome: /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent),
    isEdge: /edge/i.test(navigator.userAgent),
  };

  // 8. Check for beforeinstallprompt support
  results.checks.supportsBeforeInstallPrompt = 'onbeforeinstallprompt' in window;

  // 9. Display results
  console.group('🔍 PWA Debug Results');
  
  console.log('\n📱 Platform Detection:');
  console.table(results.platform);
  
  console.log('\n✅ PWA Checks:');
  Object.entries(results.checks).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`${icon} ${key}:`, value);
  });

  console.log('\n💡 Recommendations:');
  const recommendations: string[] = [];

  if (!results.checks.isHTTPS) {
    recommendations.push('❌ App must be served over HTTPS (or localhost for dev)');
  }
  if (results.checks.isStandalone) {
    recommendations.push('ℹ️ App is already installed - prompt won\'t show');
  }
  if (!results.checks.hasManifestLink) {
    recommendations.push('❌ Missing manifest link in HTML <head>');
  }
  if (!results.checks.hasServiceWorker) {
    recommendations.push('❌ Service Worker not supported in this browser');
  }
  if (!results.checks.serviceWorkerRegistered) {
    recommendations.push('⚠️ No Service Worker registered yet (may still be registering)');
  }
  if (results.checks.wasDismissed && !results.checks.dismissalExpired) {
    recommendations.push(`ℹ️ Prompt was dismissed ${results.checks.daysSinceDismissal} days ago (shows again after 7 days)`);
    recommendations.push('💡 Clear localStorage or use InstallAppButton to bypass dismissal');
  }
  if (!results.checks.supportsBeforeInstallPrompt) {
    recommendations.push('ℹ️ Browser doesn\'t support beforeinstallprompt event');
    recommendations.push('💡 Manual instructions will be shown instead');
  }

  if (recommendations.length === 0) {
    console.log('✅ All checks passed! Prompt should show after 3 seconds.');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }

  console.log('\n🔧 Quick Fixes:');
  console.log('- Clear dismissal: localStorage.removeItem("pwa-prompt-dismissed")');
  console.log('- Trigger manually: window.dispatchEvent(new CustomEvent("show-install-prompt"))');
  console.log('- Check console: Look for "🎉 beforeinstallprompt event fired"');
  
  console.groupEnd();

  return results;
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugPWA = debugPWA;
  console.log('💡 PWA Debug utility loaded. Run: debugPWA()');
}

export default debugPWA;
