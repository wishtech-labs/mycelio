'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAgent: boolean;
}

export function NodeNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];
    const connectionDistance = 150;
    
    // Config
    const nodeCount = 60;
    const agentRatio = 0.3; // 30% are "Agents"

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          isAgent: Math.random() < agentRatio,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      // Draw connections (A2A focus)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            
            // If both are agents, strong colored connection (A2A)
            if (nodes[i].isAgent && nodes[j].isAgent) {
              ctx.strokeStyle = `rgba(138, 43, 226, ${opacity * 0.8})`; // Purple-ish
              ctx.lineWidth = 1.5;
            } else if (nodes[i].isAgent || nodes[j].isAgent) {
              ctx.strokeStyle = `rgba(100, 100, 100, ${opacity * 0.4})`;
              ctx.lineWidth = 1;
            } else {
              ctx.strokeStyle = `rgba(50, 50, 50, ${opacity * 0.2})`;
              ctx.lineWidth = 0.5;
            }

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.isAgent ? node.radius * 2 : node.radius, 0, Math.PI * 2);
        
        if (node.isAgent) {
          ctx.fillStyle = 'rgba(180, 100, 255, 0.9)';
          ctx.shadowColor = 'rgba(180, 100, 255, 0.8)';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 移除渐变遮罩，避免底部出现色块 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-50"
      />
    </div>
  );
}
