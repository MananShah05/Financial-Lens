import os
import sys

# Dynamic system path injection to allow root-level imports on AWS Lambda / Vercel Serverless
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
