from flask import Flask, request, jsonify
from flask_cors import CORS
import matlab.engine

app = Flask(__name__)
CORS(app) # 允许跨域，别碰它！

print("Calling Matlab...")
eng = matlab.engine.start_matlab()
print("Matlab started!")

@app.route('/api/rsa', methods=['POST'])
def rsa_handler():
    try:
        data = request.json
        action_type = data.get('type')
        
        # 处理第一步：生成密钥
        if action_type == 'keygen':
            p = float(data.get('p'))
            q = float(data.get('q'))
            # 传 1.0 给 MATLAB 代表 keygen
            res_str = eng.rsa_core(1.0, p, q, 0.0)
            if "Error" in res_str:
                return jsonify({"status": "error", "message": res_str}), 500
            
            n, e, d = res_str.split(',')
            return jsonify({"status": "success", "n": n, "e": e, "d": d})
            
        # 处理第二步：加密或解密
        elif action_type == 'crypto':
            msg = float(data.get('msg'))
            key = float(data.get('key'))
            n = float(data.get('n'))
            # 传 2.0 给 MATLAB 代表 crypto
            res_str = eng.rsa_core(2.0, msg, key, n)
            if "Error" in res_str:
                return jsonify({"status": "error", "message": res_str}), 500
                
            return jsonify({"status": "success", "result": res_str})
            
    except Exception as err:
        return jsonify({"status": "error", "message": f"Python error: {str(err)}"}), 500

if __name__ == '__main__':
    # 记得在终端运行: python app.py
    app.run(port=5000, debug=True)