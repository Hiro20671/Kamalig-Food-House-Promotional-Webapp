#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Deploying Kamalig Food House Webapp on PythonAnywhere"
echo "=========================================================="

PROJECT_DIR="$HOME/Kamalig-Food-House-Promotional-Webapp"
BACKEND_DIR="$PROJECT_DIR/backend"

cd "$BACKEND_DIR"

echo "[1/4] Creating/updating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo "[2/4] Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[3/4] Running database migrations and initial seed..."
python manage.py migrate
python manage.py seed_kamalig

echo "[4/4] Collecting static files..."
python manage.py collectstatic --noinput

echo "=========================================================="
echo " Backend setup complete! Next: Reload your Web App tab."
echo "=========================================================="

