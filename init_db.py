"""
数据库初始化脚本
运行此脚本将自动创建数据库和所有表
"""
import sys

from sqlalchemy import create_engine, text

from models.database import Base, engine, DATABASE_URL


def create_database_if_not_exists():
    """如果数据库不存在则创建"""
    # 提取数据库名称
    db_name = DATABASE_URL.split('/')[-1].split('?')[0]

    # 连接到 MySQL 服务器（不指定数据库）
    base_url = DATABASE_URL.replace(f'/{db_name}', '')
    base_engine = create_engine(base_url)

    with base_engine.connect() as conn:
        # 检查数据库是否存在
        result = conn.execute(text(f"SHOW DATABASES LIKE '{db_name}'"))
        if not result.fetchone():
            print(f"📦 创建数据库: {db_name}")
            conn.execute(text(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
            print("✅ 数据库创建成功")
        else:
            print(f"✓ 数据库已存在: {db_name}")


def create_tables():
    """创建所有表"""
    print("\n🔨 开始创建数据表...")
    Base.metadata.create_all(bind=engine)
    print("✅ 所有数据表创建成功\n")


def show_tables():
    """显示已创建的表"""
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print("=" * 50)
    print("📋 已创建的数据表:")
    print("=" * 50)
    for table in tables:
        columns = inspector.get_columns(table)
        print(f"\n📌 {table} ({len(columns)} 个字段)")
        for col in columns[:5]:  # 只显示前5个字段
            print(f"   - {col['name']}: {col['type']}")
        if len(columns) > 5:
            print(f"   ... 还有 {len(columns) - 5} 个字段")
    print("=" * 50)


if __name__ == "__main__":
    try:
        print("🚀 开始初始化数据库...\n")

        # 1. 创建数据库
        create_database_if_not_exists()

        # 2. 创建所有表
        create_tables()

        # 3. 显示表结构
        show_tables()

        print("\n🎉 数据库初始化完成！可以开始使用了！")

    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        print("\n请检查:")
        print("1. MySQL 服务是否正在运行")
        print("2. database.py 中的连接配置是否正确")
        print("3. 用户名和密码是否正确")
        sys.exit(1)
