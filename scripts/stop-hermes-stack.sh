#!/bin/bash

# Configuration
GATEWAY_PORT=8642
DASHBOARD_PORT=9119
UI_PORT=3000

echo "=== Stopping Hermes Stack ==="

# 1. Stop Workspace UI
echo "Checking Workspace UI on port $UI_PORT..."
if lsof -i :$UI_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    UI_PID=$(lsof -t -i :$UI_PORT)
    UI_CMD=$(ps -p $UI_PID -o command= 2>/dev/null)
    echo "Found process $UI_PID on port $UI_PORT: $UI_CMD"
    
    # Verify if it belongs to hermes-workspace (contains node, vite, or pnpm dev)
    if [[ "$UI_CMD" == *"node"* || "$UI_CMD" == *"vite"* || "$UI_CMD" == *"pnpm"* ]]; then
        echo "Stopping Workspace UI (PID: $UI_PID)..."
        kill $UI_PID
        sleep 2
        if lsof -i :$UI_PORT -sTCP:LISTEN >/dev/null 2>&1; then
            echo "Warning: Workspace UI on port $UI_PORT did not stop. (Consider manually running: kill -9 $UI_PID)"
        else
            echo "✓ Workspace UI stopped."
        fi
    else
        echo "Warning: Process on port $UI_PORT does not match standard Workspace UI pattern. Skipping."
    fi
else
    echo "Workspace UI is not running on port $UI_PORT."
fi

# 2. Stop Dashboard
echo "Checking Hermes Dashboard on port $DASHBOARD_PORT..."
if lsof -i :$DASHBOARD_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    DASH_PID=$(lsof -t -i :$DASHBOARD_PORT)
    echo "Stopping Hermes Dashboard using 'hermes dashboard --stop'..."
    hermes dashboard --stop
    sleep 2
    if lsof -i :$DASHBOARD_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo "Dashboard still running on port $DASHBOARD_PORT. Killing process $DASH_PID..."
        kill $DASH_PID
    fi
    sleep 1
    if lsof -i :$DASHBOARD_PORT -sTCP:LISTEN >/dev/null 2>&1; then
        echo "Warning: Dashboard did not stop. Consider manual kill."
    else
        echo "✓ Dashboard stopped."
    fi
else
    echo "Dashboard is not running on port $DASHBOARD_PORT."
fi

# 3. Gateway warning/instruction
echo "Checking Hermes Gateway on port $GATEWAY_PORT..."
if lsof -i :$GATEWAY_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    GW_PID=$(lsof -t -i :$GATEWAY_PORT)
    echo "Gateway is running on port $GATEWAY_PORT (PID: $GW_PID)."
    echo "IMPORTANT: The Gateway is a background API coordinator and should generally remain active."
    echo "If you explicitly want to stop it, run:"
    echo "  hermes gateway stop"
    echo "Or kill the process manually: kill $GW_PID"
else
    echo "Gateway is not running."
fi

echo "Tailscale is left running by default."
