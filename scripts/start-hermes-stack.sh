#!/bin/bash

# Configuration
GATEWAY_PORT=8642
DASHBOARD_PORT=9119
UI_PORT=3000
TS_IP="100.98.144.126"

echo "=== Starting Hermes Stack ==="

# Check Tailscale
if command -v tailscale >/dev/null 2>&1; then
    TS_STATUS=$(tailscale status 2>/dev/null)
    if [ -n "$TS_STATUS" ]; then
        echo "Tailscale is connected."
        TS_IP=$(tailscale ip -4 2>/dev/null)
    else
        echo "Warning: Tailscale is not active. Network access may be restricted."
    fi
else
    echo "Warning: Tailscale CLI not found."
fi

# 1. Check/Start Gateway
echo "Checking Hermes Gateway on port $GATEWAY_PORT..."
if lsof -i :$GATEWAY_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Gateway is already running."
else
    echo "Starting Hermes Gateway..."
    mkdir -p ~/.hermes/logs
    nohup hermes gateway run > ~/.hermes/logs/gateway-restart.log 2>&1 &
    sleep 3
    if lsof -i :$GATEWAY_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo "✓ Gateway started successfully."
    else
        echo "✗ Failed to start Gateway. Check logs at ~/.hermes/logs/gateway-restart.log"
    fi
fi

# 2. Check/Start Dashboard
echo "Checking Hermes Dashboard on port $DASHBOARD_PORT..."
if lsof -i :$DASHBOARD_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Dashboard is already running."
else
    echo "Starting Hermes Dashboard..."
    nohup hermes dashboard --no-open --port $DASHBOARD_PORT > ~/.hermes/server.log 2>&1 &
    sleep 3
    if lsof -i :$DASHBOARD_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo "✓ Dashboard started successfully."
    else
        echo "✗ Failed to start Dashboard. Check logs at ~/.hermes/server.log"
    fi
fi

# 3. Check/Start Workspace UI
echo "Checking Workspace UI on port $UI_PORT..."
if lsof -i :$UI_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Workspace UI is already running (Port $UI_PORT occupied)."
else
    echo "Starting Workspace UI from /Users/shaungillen/hermes-workspace..."
    cd /Users/shaungillen/hermes-workspace
    nohup pnpm dev > ~/.hermes/ui.log 2>&1 &
    sleep 3
    if lsof -i :$UI_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo "✓ Workspace UI started successfully."
    else
        echo "✗ Failed to start Workspace UI. Check logs at ~/.hermes/ui.log"
    fi
fi

echo ""
echo "=== Hermes Endpoints ==="
echo "Gateway Health:  http://127.0.0.1:$GATEWAY_PORT/health"
echo "Dashboard:       http://127.0.0.1:$DASHBOARD_PORT"
echo "Workspace UI:    http://localhost:$UI_PORT/"
if [ -n "$TS_IP" ]; then
    echo "Tailscale UI:    http://$TS_IP:$UI_PORT/"
fi
