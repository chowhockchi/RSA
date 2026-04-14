function result_str = rsa_core(action, v1, v2, v3)
    % action: 1 表示生成密钥, 2 表示加密/解密
    try
        if action == 1
            p = int64(v1); q = int64(v2);
            n = p * q;
            phi = (p - 1) * (q - 1);
            e = int64(3); % 公钥指数从 3 开始找
            while gcd(e, phi) ~= 1
                e = e + 1;
            end
            % 扩展欧几里得求私钥 d
            [~, x, ~] = gcd(double(e), double(phi));
            d = int64(mod(x, double(phi)));
            if d < 0
                d = d + phi;
            end
            % 拼成字符串返回: n,e,d
            result_str = sprintf('%d,%d,%d', n, e, d);
            
        elseif action == 2
            msg = int64(v1); key = int64(v2); n = int64(v3);
            % 调用快速幂取模进行加解密
            res = modExp(msg, key, n);
            result_str = sprintf('%d', res);
        else
            result_str = 'Error.';
        end
    catch ME
        result_str = ['Error.', ME.message];
    end
end

% 防溢出函数：快速幂取模
function result = modExp(base, exponent, mod_val)
    result = int64(1);
    base = int64(mod(double(base), double(mod_val)));
    while exponent > 0
        if mod(exponent, 2) == 1
            result = mod(result * base, mod_val);
        end
        exponent = idivide(exponent, int64(2), 'floor');
        base = mod(base * base, mod_val);
    end
end