/**
 * Initialization Event Listener
 * Populates cryptographic parameters from sessionStorage if available.
 */
document.addEventListener('DOMContentLoaded', () => {
    const nStr = sessionStorage.getItem('rsa_n');
    const eStr = sessionStorage.getItem('rsa_e');
    const dStr = sessionStorage.getItem('rsa_d');

    const elN_enc = document.getElementById('inputN_enc');
    const elE_enc = document.getElementById('inputE_enc');
    if (elN_enc && nStr) elN_enc.value = nStr;
    if (elE_enc && eStr) elE_enc.value = eStr;

    const elN_dec = document.getElementById('inputN_dec');
    const elD_dec = document.getElementById('inputD_dec');
    if (elN_dec && nStr) elN_dec.value = nStr;
    if (elD_dec && dStr) elD_dec.value = dStr;
});

/**
 * Core Mathematical Utility Functions (BigInt)
 */
function gcd(a, b) {
    while (b !== 0n) { 
        let temp = b; 
        b = a % b; 
        a = temp; 
    }
    return a;
}

function modInverse(e, phi) {
    let m0 = phi, y = 0n, x = 1n;
    if (phi === 1n) return 0n;
    while (e > 1n) {
        let q = e / phi;
        let t = phi;
        phi = e % phi;
        e = t;
        t = y; 
        y = x - q * y; 
        x = t;
    }
    if (x < 0n) x += m0;
    return x;
}

function modPow(base, exp, mod) {
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        exp = exp / 2n;
        base = (base * base) % mod;
    }
    return result;
}

function getRandomBigInt(min, max) {
    const range = max - min;
    if (range <= 0n) return min;
    
    const rangeStr = range.toString();
    let randomStr = '';
    for (let i = 0; i < rangeStr.length; i++) {
        randomStr += Math.floor(Math.random() * 10).toString();
    }
    return (BigInt(randomStr) % range) + min;
}

/**
 * Miller-Rabin Primality Testing
 */
function isProbablePrime(n, k = 5) {
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n) return false;

    let d = n - 1n;
    let r = 0n;
    while (d % 2n === 0n) {
        d /= 2n;
        r++;
    }

    for (let i = 0; i < k; i++) {
        let a;
        if (n <= 4n) {
            a = 2n;
        } else {
            let maxRandom = n > 1000000n ? 1000000n : n;
            a = BigInt(Math.floor(Math.random() * (Number(maxRandom) - 3))) + 2n;
        }

        let x = modPow(a, d, n);
        if (x === 1n || x === n - 1n) continue;

        let composite = true;
        for (let j = 0n; j < r - 1n; j++) {
            x = modPow(x, 2n, n);
            if (x === n - 1n) {
                composite = false;
                break;
            }
        }
        if (composite) return false;
    }
    return true;
}

/**
 * Random Prime Number Generator
 */
function generateRandomPrime() {
    const min = 10000000000n; 
    const max = 99999999999n; 
    
    while(true) {
        let candidate = getRandomBigInt(min, max);
        if (candidate % 2n === 0n) candidate += 1n;
        if (isProbablePrime(candidate, 5)) {
            return candidate;
        }
    }
}

function drawRandomPrimes() {
    hideError('keyError');
    const btn = document.querySelector('.btn-draw');
    btn.innerText = "Generating...";
    
    setTimeout(() => {
        try {
            let p = generateRandomPrime();
            let q = generateRandomPrime();
            
            while (p === q) {
                q = generateRandomPrime();
            }
            
            document.getElementById('inputP').value = p.toString();
            document.getElementById('inputQ').value = q.toString();
            
            btn.innerText = "Draw Random Primes";
        } catch (e) {
            displayError('keyError', "System Error: Failed to generate prime numbers.");
            btn.innerText = "Draw Random Primes";
        }
    }, 100);
}

/**
 * UI State Management
 */
function displayError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = message;
        el.style.display = 'block';
    }
}

function hideError(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = 'none';
}

/**
 * Key Generation Logic (Executed in index.html)
 */
function generateKeys() {
    hideError('keyError');
    try {
        const pInput = document.getElementById('inputP').value.trim();
        const qInput = document.getElementById('inputQ').value.trim();

        if (!pInput || !qInput) throw new Error("Both prime parameters (p and q) are required.");
        if (!/^\d+$/.test(pInput) || !/^\d+$/.test(qInput)) throw new Error("Input must contain strictly numeric characters.");

        const p = BigInt(pInput);
        const q = BigInt(qInput);
        
        if (p === q) throw new Error("Parameters p and q must be distinct prime numbers.");
        if (!isProbablePrime(p)) throw new Error(`Validation failed: The parameter 'p' is not a valid prime.`);
        if (!isProbablePrime(q)) throw new Error(`Validation failed: The parameter 'q' is not a valid prime.`);

        const n = p * q;
        const phi = (p - 1n) * (q - 1n);

        const minE = 3n;
        const maxE = phi - 1n;
        
        let e = getRandomBigInt(minE, maxE);
        if (e % 2n === 0n) e += 1n;

        while (gcd(e, phi) !== 1n) {
            e += 2n;
            if (e >= maxE) e = 3n; 
        }

        const d = modInverse(e, phi);

        sessionStorage.setItem('rsa_n', n.toString());
        sessionStorage.setItem('rsa_e', e.toString());
        sessionStorage.setItem('rsa_d', d.toString());

        const resBox = document.getElementById('keyResult');
        resBox.innerHTML = `<strong>Public Key (n, e):</strong><br>(${n}, ${e})<br><br><strong>Private Key (n, d):</strong><br>(${n}, ${d})<br><br><span style="color:#1e8449;">Keys successfully stored in session. You may proceed.</span>`;
        
    } catch (err) {
        displayError('keyError', "Initialization Error: " + err.message);
        sessionStorage.removeItem('rsa_n');
        sessionStorage.removeItem('rsa_e');
        sessionStorage.removeItem('rsa_d');
        document.getElementById('keyResult').innerHTML = "<strong>Status:</strong><br><span style='color:#c0392b;'>Generation Failed</span>";
    }
}

/**
 * Encryption Logic (Executed in encryption.html)
 */
function executeEncryption() {
    hideError('encryptError');
    
    const nStr = document.getElementById('inputN_enc').value.trim();
    const eStr = document.getElementById('inputE_enc').value.trim();

    if (!nStr || !eStr) {
        displayError('encryptError', "Missing Parameters: Modulus (n) and Public Exponent (e) are required.");
        return;
    }
    
    if (!/^\d+$/.test(nStr) || !/^\d+$/.test(eStr)) {
        displayError('encryptError', "Format Error: Parameters must be numeric integers.");
        return;
    }
    
    const textVal = document.getElementById('inputPlaintext').value.trim();
    if (!textVal) {
        displayError('encryptError', "Input Fault: Plaintext field is empty.");
        return;
    }
    if (!/^\d+$/.test(textVal)) {
        displayError('encryptError', "Format Error: Plaintext must be a numeric integer.");
        return;
    }

    const resSpan = document.getElementById('encryptResult');

    try {
        const msg = BigInt(textVal);
        const n = BigInt(nStr);
        const e = BigInt(eStr);
        
        if (msg >= n) {
            throw new Error(`Data Bound Error: Plaintext M must be strictly less than modulus n.`);
        }

        const ciphertext = modPow(msg, e, n);
        resSpan.innerText = ciphertext.toString();
        resSpan.style.color = "#b03a2e";
    } catch (err) {
        displayError('encryptError', "Encryption Halted: " + err.message);
        resSpan.innerText = "-";
    }
}

/**
 * Decryption Logic (Executed in decryption.html)
 */
function executeDecryption() {
    hideError('decryptError');
    
    const nStr = document.getElementById('inputN_dec').value.trim();
    const dStr = document.getElementById('inputD_dec').value.trim();

    if (!nStr || !dStr) {
        displayError('decryptError', "Missing Parameters: Modulus (n) and Private Exponent (d) are required.");
        return;
    }

    if (!/^\d+$/.test(nStr) || !/^\d+$/.test(dStr)) {
        displayError('decryptError', "Format Error: Parameters must be numeric integers.");
        return;
    }
    
    const textVal = document.getElementById('inputCiphertext').value.trim();
    if (!textVal) {
        displayError('decryptError', "Input Fault: Ciphertext field is empty.");
        return;
    }
    if (!/^\d+$/.test(textVal)) {
        displayError('decryptError', "Format Error: Ciphertext must be a numeric integer.");
        return;
    }

    const resSpan = document.getElementById('decryptResult');

    try {
        const cipher = BigInt(textVal);
        const n = BigInt(nStr);
        const d = BigInt(dStr);
        
        if (cipher >= n) {
            throw new Error(`Data Bound Error: Ciphertext C cannot exceed modulus n.`);
        }

        const plaintext = modPow(cipher, d, n);
        resSpan.innerText = plaintext.toString();
        resSpan.style.color = "#1e8449";
    } catch (err) {
        displayError('decryptError', "Decryption Halted: " + err.message);
        resSpan.innerText = "-";
    }
}
