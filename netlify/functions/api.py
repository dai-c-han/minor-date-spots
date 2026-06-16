import sys
import os

# Functions実行時にbackendディレクトリをパスに追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from main import app
from mangum import Mangum

handler = Mangum(app, lifespan="off")
