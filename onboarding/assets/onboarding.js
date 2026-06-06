// OS Detection
function detectOS() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    let os = 'unknown';
    let icon = '💻';
    let name = 'Unknown System';
    let version = '';
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        os = 'ios';
        icon = '📱';
        name = 'iOS';
        if (/iPhone/i.test(userAgent)) name = 'iPhone';
        else if (/iPad/i.test(userAgent)) name = 'iPad';
        else if (/iPod/i.test(userAgent)) name = 'iPod';
    } else if (/Android/i.test(userAgent)) {
        os = 'android';
        icon = '🤖';
        name = 'Android';
    } else if (/Mac/i.test(platform)) {
        os = 'macos';
        icon = '🍎';
        name = 'macOS';
        if (/Mac OS X 10_15|macOS 10.15/i.test(userAgent)) version = 'Catalina';
        else if (/Mac OS X 10_14/i.test(userAgent)) version = 'Mojave';
        else if (/macOS 11/i.test(userAgent)) version = 'Big Sur';
        else if (/macOS 12/i.test(userAgent)) version = 'Monterey';
        else if (/macOS 13/i.test(userAgent)) version = 'Ventura';
        else if (/macOS 14/i.test(userAgent)) version = 'Sonoma';
    } else if (/Win/i.test(platform)) {
        os = 'windows';
        icon = '🪟';
        name = 'Windows';
        if (/Windows NT 10.0/i.test(userAgent)) version = '10/11';
        else if (/Windows NT 6.3/i.test(userAgent)) version = '8.1';
        else if (/Windows NT 6.2/i.test(userAgent)) version = '8';
    } else if (/Linux/i.test(platform)) {
        os = 'linux';
        icon = '🐧';
        name = 'Linux';
        if (/Ubuntu/i.test(userAgent)) version = 'Ubuntu';
        else if (/Fedora/i.test(userAgent)) version = 'Fedora';
        else if (/Debian/i.test(userAgent)) version = 'Debian';
    }
    
    return { os, icon, name, version };
}

function showMethod(os) {
    const methods = ['macos', 'ios', 'windows', 'linux', 'android'];
    methods.forEach(m => {
        const el = document.getElementById(m + 'Method');
        if (el) el.style.display = 'none';
    });
    
    const target = document.getElementById(os + 'Method');
    if (target) {
        target.style.display = 'block';
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    const unknown = document.getElementById('unknownMethod');
    if (unknown) unknown.style.display = 'none';
}

// Initialize OS detection
function initOSDetection() {
    const detected = detectOS();
    const osIcon = document.getElementById('osIcon');
    const osName = document.getElementById('osName');
    const osVersion = document.getElementById('osVersion');
    
    if (osIcon) osIcon.textContent = detected.icon;
    if (osName) osName.textContent = detected.name + (detected.version ? ' ' + detected.version : '');
    if (osVersion) osVersion.textContent = 'We\'ve prepared instructions for your system';
    
    showMethod(detected.os);
}

// Copy to clipboard
function copyToClipboard(button) {
    const codeBlock = button.parentElement.querySelector('pre');
    if (codeBlock) {
        const text = codeBlock.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const original = button.textContent;
            button.textContent = '✓ Copied!';
            setTimeout(() => {
                button.textContent = original;
            }, 2000);
        });
    }
}

// Toggle alternative methods
function toggleAlternative(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
}

// Test Suite
async function runAllTests() {
    const btn = document.getElementById('runTestsBtn');
    const summary = document.getElementById('testSummary');
    const troubleshoot = document.getElementById('troubleshooting');
    const troubleshootContent = document.getElementById('troubleshootContent');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Running tests...</span>';
    }
    
    let allPassed = true;
    const failures = [];
    
    // Test 1: Tailscale Connection
    await testTailscaleConnection();
    
    // Test 2: DNS Resolution
    await testDNSResolution();
    
    // Test 3: HTTPS Certificate
    await testHTTPSCertificate();
    
    // Check results
    const tests = document.querySelectorAll('.test-item');
    tests.forEach(test => {
        const status = test.querySelector('.test-status');
        if (status.classList.contains('error')) {
            allPassed = false;
            const testName = test.querySelector('.test-name').textContent;
            failures.push(testName);
        }
    });
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🔄 Re-run Tests</span>';
    }
    
    if (summary) {
        summary.style.display = 'block';
        if (allPassed) {
            summary.className = 'test-summary all-pass';
            summary.innerHTML = '✅ All tests passed! You\'re ready to access PaceySpace services.';
        } else {
            summary.className = 'test-summary has-failures';
            summary.innerHTML = `⚠️ Some tests failed. Check the troubleshooting section below.`;
        }
    }
    
    if (troubleshoot && troubleshootContent) {
        if (!allPassed) {
            troubleshoot.style.display = 'block';
            let html = '<p>Here are the issues we found and how to fix them:</p><ul>';
            
            if (failures.includes('Tailscale Connection')) {
                html += '<li><strong>Tailscale not connected:</strong> Make sure the Tailscale app is running and you\'re logged in. Try restarting the app.</li>';
            }
            if (failures.includes('DNS Resolution')) {
                html += '<li><strong>DNS not working:</strong> Make sure "Use Tailscale DNS" is enabled in the Tailscale app settings. Check that your device is using the Tailscale nameserver (100.100.100.100).</li>';
            }
            if (failures.includes('HTTPS Certificate')) {
                html += '<li><strong>Certificate not trusted:</strong> Go back to Step 1 and install the workspace certificate. Make sure you completed all steps for your operating system.</li>';
            }
            
            html += '</ul><p>If you still have issues, contact the team on Slack or check the documentation.</p>';
            troubleshootContent.innerHTML = html;
        } else {
            troubleshoot.style.display = 'none';
        }
    }
    
    // Scroll to summary
    if (summary) {
        summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

async function testTailscaleConnection() {
    const testItem = document.getElementById('testTailscale');
    const status = testItem.querySelector('.test-status');
    const details = testItem.querySelector('.test-details');
    const tsIP = document.getElementById('tsIP');
    const tsStatus = document.getElementById('tsStatus');
    
    status.className = 'test-status pending';
    status.querySelector('.test-icon').textContent = '⏳';
    
    // Try to detect Tailscale IP via fetch to a known internal endpoint
    // Since we can't directly query Tailscale, we'll check if we can resolve .pspace domains
    try {
        const start = Date.now();
        const response = await fetch('https://proxy.pspace/dashboard/', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
        });
        const elapsed = Date.now() - start;
        
        // If we got here, we at least resolved the DNS
        status.className = 'test-status success';
        status.querySelector('.test-icon').textContent = '✅';
        
        if (tsIP) tsIP.textContent = 'Connected (Tailscale network reachable)';
        if (tsStatus) tsStatus.textContent = '✅ Connected in ' + elapsed + 'ms';
        
    } catch (error) {
        // Try alternative: check if we can reach any .pspace domain
        try {
            await fetch('https://nebula.pspace', {
                method: 'HEAD',
                mode: 'no-cors',
                signal: AbortSignal.timeout(3000)
            });
            
            status.className = 'test-status success';
            status.querySelector('.test-icon').textContent = '✅';
            
            if (tsIP) tsIP.textContent = 'Connected';
            if (tsStatus) tsStatus.textContent = '✅ Network reachable';
        } catch (e2) {
            status.className = 'test-status error';
            status.querySelector('.test-icon').textContent = '❌';
            
            if (tsIP) tsIP.textContent = 'Not detected';
            if (tsStatus) tsStatus.textContent = '❌ Cannot reach Tailscale network';
        }
    }
    
    if (details) details.style.display = 'block';
}

async function testDNSResolution() {
    const testItem = document.getElementById('testDNS');
    const status = testItem.querySelector('.test-status');
    const details = testItem.querySelector('.test-details');
    
    status.className = 'test-status pending';
    status.querySelector('.test-icon').textContent = '⏳';
    
    const tests = [
        { id: 'dnsProxy', name: 'proxy.pspace', url: 'https://proxy.pspace' },
        { id: 'dnsNebula', name: 'nebula.pspace', url: 'https://nebula.pspace' },
        { id: 'dnsPublic', name: 'archive.ubuntu.com', url: 'https://archive.ubuntu.com' }
    ];
    
    let allResolved = true;
    
    for (const test of tests) {
        const el = document.getElementById(test.id);
        if (el) {
            const result = el.querySelector('.dns-result');
            if (result) result.textContent = 'Testing...';
        }
    }
    
    for (const test of tests) {
        const el = document.getElementById(test.id);
        if (el) {
            const result = el.querySelector('.dns-result');
            try {
                await fetch(test.url, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (result) {
                    result.textContent = '✅ Resolved';
                    result.style.background = 'var(--success-light)';
                    result.style.color = 'var(--success)';
                }
                el.classList.add('success');
            } catch (error) {
                if (result) {
                    result.textContent = '❌ Failed';
                    result.style.background = 'var(--error-light)';
                    result.style.color = 'var(--error)';
                }
                el.classList.add('error');
                allResolved = false;
            }
        }
    }
    
    if (allResolved) {
        status.className = 'test-status success';
        status.querySelector('.test-icon').textContent = '✅';
    } else {
        status.className = 'test-status error';
        status.querySelector('.test-icon').textContent = '❌';
    }
    
    if (details) details.style.display = 'block';
}

async function testHTTPSCertificate() {
    const testItem = document.getElementById('testHTTPS');
    const status = testItem.querySelector('.test-status');
    const details = testItem.querySelector('.test-details');
    
    status.className = 'test-status pending';
    status.querySelector('.test-icon').textContent = '⏳';
    
    const tests = [
        { id: 'certProxy', name: 'proxy.pspace', url: 'https://proxy.pspace/dashboard/' },
        { id: 'certNebula', name: 'nebula.pspace', url: 'https://nebula.pspace' }
    ];
    
    let allTrusted = true;
    
    for (const test of tests) {
        const el = document.getElementById(test.id);
        if (el) {
            const result = el.querySelector('.cert-result');
            if (result) result.textContent = 'Testing...';
        }
    }
    
    for (const test of tests) {
        const el = document.getElementById(test.id);
        if (el) {
            const result = el.querySelector('.cert-result');
            try {
                // Try to fetch with full CORS - this will fail if cert is untrusted
                const response = await fetch(test.url, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok || response.status === 405 || response.status === 401) {
                    if (result) {
                        result.textContent = '✅ Trusted';
                        result.style.background = 'var(--success-light)';
                        result.style.color = 'var(--success)';
                    }
                    el.classList.add('success');
                } else {
                    throw new Error('Unexpected status: ' + response.status);
                }
            } catch (error) {
                // If it's a TypeError about failed to fetch, it's likely cert issue
                if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                    if (result) {
                        result.textContent = '❌ Not Trusted';
                        result.style.background = 'var(--error-light)';
                        result.style.color = 'var(--error)';
                    }
                    el.classList.add('error');
                    allTrusted = false;
                } else {
                    // Network error, might be DNS
                    if (result) {
                        result.textContent = '⚠️ Network Error';
                        result.style.background = 'var(--warning-light)';
                        result.style.color = 'var(--warning)';
                    }
                    el.classList.add('error');
                    allTrusted = false;
                }
            }
        }
    }
    
    if (allTrusted) {
        status.className = 'test-status success';
        status.querySelector('.test-icon').textContent = '✅';
    } else {
        status.className = 'test-status error';
        status.querySelector('.test-icon').textContent = '❌';
    }
    
    if (details) details.style.display = 'block';
}

// Email Form
function validateEmail() {
    const input = document.getElementById('emailUsername');
    const validation = document.getElementById('emailValidation');
    const value = input.value;
    
    if (!value) {
        validation.className = 'form-validation';
        validation.textContent = '';
        return false;
    }
    
    const valid = /^[a-z0-9._-]+$/.test(value);
    
    if (valid) {
        validation.className = 'form-validation valid';
        validation.textContent = '✅ Looks good!';
        return true;
    } else {
        validation.className = 'form-validation invalid';
        validation.textContent = '❌ Only lowercase letters, numbers, dots, hyphens, and underscores allowed';
        return false;
    }
}

function submitEmailRequest() {
    const username = document.getElementById('emailUsername').value;
    const fullName = document.getElementById('emailFullName').value;
    const role = document.getElementById('emailRole').value;
    const notes = document.getElementById('emailNotes').value;
    const status = document.getElementById('emailStatus');
    const form = document.getElementById('emailForm');
    const info = document.getElementById('emailInfo');
    
    if (!username || !fullName || !role) {
        if (status) {
            status.className = 'form-status error';
            status.textContent = 'Please fill in all required fields.';
        }
        return;
    }
    
    if (!validateEmail()) {
        if (status) {
            status.className = 'form-status error';
            status.textContent = 'Please fix the username format.';
        }
        return;
    }
    
    // Store request locally (since we don't have a backend yet)
    const request = {
        username: username,
        fullName: fullName,
        role: role,
        notes: notes,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Store in localStorage
    let requests = JSON.parse(localStorage.getItem('paceyspace_email_requests') || '[]');
    requests.push(request);
    localStorage.setItem('paceyspace_email_requests', JSON.stringify(requests));
    
    // Show success
    if (form) form.style.display = 'none';
    if (info) {
        info.style.display = 'block';
        const requestedEmail = document.getElementById('requestedEmail');
        if (requestedEmail) requestedEmail.textContent = username + '@paceyspace.com';
    }
    
    // Also try to send to a notification endpoint if available
    // For now, we'll just log it
    console.log('Email request submitted:', request);
}

// Tab switching
function showTab(tab) {
    const tabs = ['imap', 'smtp'];
    tabs.forEach(t => {
        const content = document.getElementById(t + 'Tab');
        if (content) content.style.display = 'none';
        
        const btn = document.querySelector('.tab-btn[onclick="showTab(\'' + t + '\')"]');
        if (btn) btn.classList.remove('active');
    });
    
    const activeContent = document.getElementById(tab + 'Tab');
    if (activeContent) activeContent.style.display = 'block';
    
    const activeBtn = document.querySelector('.tab-btn[onclick="showTab(\'' + tab + '\')"]');
    if (activeBtn) activeBtn.classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initOSDetection();
    
    // Set up email validation
    const emailInput = document.getElementById('emailUsername');
    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
    }
    
    // Make test items clickable to expand
    document.querySelectorAll('.test-status').forEach(el => {
        el.addEventListener('click', function() {
            const details = this.parentElement.querySelector('.test-details');
            if (details) {
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            }
        });
    });
});
