from flask import Flask, render_template, jsonify, request

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('test.html')

@app.route('/api/hello')
def hello_world():
    return jsonify({
        'message': 'Hello World!',
        'status': 'success'
    })

@app.route('/api/test/get')
def test_get():
    data = {
        'id': 1,
        'name': '测试数据',
        'items': ['项目1', '项目2', '项目3'],
        'timestamp': '2026-05-08'
    }
    return jsonify({
        'status': 'success',
        'data': data
    })

@app.route('/api/test/post', methods=['POST'])
def test_post():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'status': 'error', 'message': '没有接收到数据'}), 400

    response_data = {
        'status': 'success',
        'message': '数据接收成功',
        'received': json_data,
        'echo': f"你发送的是: {json_data.get('message', '空消息')}"
    }
    return jsonify(response_data)


if __name__ == '__main__':
    app.run(debug=True)