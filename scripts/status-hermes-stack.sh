#!/bin/bash

# Port definitions
GATEWAY_PORT=8642
DASHBOARD_PORT=9119
UI_PORT=3000
DREW_IP="100.109.186.26"

echo "=== Hermes Stack Status Check ==="

# Check Tailscale
if command -v tailscale >/dev/null 2>&1; then
    TS_STATUS=$(tailscale status 2>/dev/null)
    if [ -n "$TS_STATUS" ]; then
        TS_IP=$(tailscale ip -4 2>/dev/null)
        echo "Tailscale: UP (IP: $TS_IP)"
    else
        echo "Tailscale: DOWN (Not logged in or inactive)"
    fi
else
    echo "Tailscale: DOWN (tailscale CLI not found)"
fi

# Check Gateway (8642)
GATEWAY_STATUS="DOWN"
GATEWAY_PID=""
GATEWAY_OWNER=""
if lsof -i :$GATEWAY_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    GATEWAY_PID=$(lsof -t -i :$GATEWAY_PORT)
    GATEWAY_OWNER=$(lsof -i :$GATEWAY_PORT | awk 'NR==2 {print $1}')
    # Check health response
    HEALTH_RESP=$(curl -s --connect-timeout 2 http://127.0.0.1:$GATEWAY_PORT/health)
    if [[ "$HEALTH_RESP" == *"hermes-agent"* ]]; then
        GATEWAY_STATUS="UP"
    else
        GATEWAY_STATUS="UP (Unresponsive or wrong endpoint)"
    fi
fi
if [ "$GATEWAY_STATUS" = "UP" ]; then
    echo "Gateway: UP (Port $GATEWAY_PORT, PID: $GATEWAY_PID, Owner: $GATEWAY_OWNER)"
else
    echo "Gateway: DOWN"
fi

# Check Dashboard (9119)
DASHBOARD_STATUS="DOWN"
DASHBOARD_PID=""
DASHBOARD_OWNER=""
if lsof -i :$DASHBOARD_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    DASHBOARD_PID=$(lsof -t -i :$DASHBOARD_PORT)
    DASHBOARD_OWNER=$(lsof -i :$DASHBOARD_PORT | awk 'NR==2 {print $1}')
    DASH_RESP=$(curl -s --connect-timeout 2 http://127.0.0.1:$DASHBOARD_PORT/api/status)
    if [ -n "$DASH_RESP" ]; then
        DASHBOARD_STATUS="UP"
    else
        DASHBOARD_STATUS="UP (API unresponsive)"
    fi
fi
if [ "$DASHBOARD_STATUS" = "UP" ]; then
    echo "Dashboard: UP (Port $DASHBOARD_PORT, PID: $DASHBOARD_PID, Owner: $DASHBOARD_OWNER)"
else
    echo "Dashboard: DOWN"
fi

# Check Workspace UI (3000)
UI_STATUS="DOWN"
UI_PID=""
UI_OWNER=""
if lsof -i :$UI_PORT -sTCP:LISTEN >/dev/null 2>&1; then
    UI_PID=$(lsof -t -i :$UI_PORT)
    UI_OWNER=$(lsof -i :$UI_PORT | awk 'NR==2 {print $1}')
    UI_RESP=$(curl -I -s --connect-timeout 2 http://127.0.0.1:$UI_PORT 2>/dev/null)
    if [ -n "$UI_RESP" ]; then
        UI_STATUS="UP"
    else
        UI_STATUS="UP (Unresponsive)"
    fi
fi
if [ "$UI_STATUS" = "UP" ]; then
    echo "Workspace UI: UP (Port $UI_PORT, PID: $UI_PID, Owner: $UI_OWNER)"
else
    echo "Workspace UI: DOWN"
fi

# Check Drew Worker Node (Tailscale 100.109.186.26)
if command -v tailscale >/dev/null 2>&1; then
    DREW_LINE=$(tailscale status 2>/dev/null | grep -i drew)
    if [[ "$DREW_LINE" == *"offline"* || -z "$DREW_LINE" ]]; then
        echo "Drew Worker: OFFLINE / UNVERIFIED (IP: $DREW_IP)"
    else
        # Try pinging briefly
        if ping -c 1 -t 1 $DREW_IP >/dev/null 2>&1; then
            echo "Drew Worker: ONLINE (IP: $DREW_IP)"
        else
            echo "Drew Worker: UNREACHABLE (IP: $DREW_IP, offline in tailnet or firewall block)"
        fi
    fi
else
    echo "Drew Worker: UNVERIFIED (tailscale not available)"
fi

# Recommendations & Next Actions
echo ""
echo "=== Recommendations ==="
if [ "$GATEWAY_STATUS" != "UP" ]; then
    echo "Next Action: Start the Gateway using scripts/start-hermes-stack.sh or 'hermes gateway run'"
elif [ "$DASHBOARD_STATUS" != "UP" ]; then
    echo "Next Action: Start the Dashboard using scripts/start-hermes-stack.sh or 'hermes dashboard'"
elif [ "$UI_STATUS" != "UP" ]; then
    echo "Next Action: Start the Workspace UI using scripts/start-hermes-stack.sh or 'cd /Users/shaungillen/hermes-workspace && pnpm dev'"
else
    echo "All local Hermes services are running normally."
fi
