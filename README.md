# Github_task_assign

AI 任务分配代理系统 - 基于 GitHub Issue 和 Pull Request 的智能任务分配平台

## 项目结构

```
/workspace
├── backend/           # 后端服务 (FastAPI)
│   ├── main.py       # 主应用文件
│   ├── requirements.txt
│   └── data/         # 数据存储目录
├── frontend/          # 前端应用 (React + Ant Design)
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   ├── services/     # API 服务
│   │   ├── store/        # 状态管理
│   │   └── App.jsx       # 主应用组件
│   └── package.json
└── docs/             # 文档
    └── README.md     # 详细使用文档
```

## 快速启动

### 后端
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

详细文档请查看 [docs/README.md](docs/README.md)