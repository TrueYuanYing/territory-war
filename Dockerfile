# 海岛争霸 游戏服务器镜像（腾讯云 CloudBase 云托管 / 任意容器平台）
FROM node:22-alpine
WORKDIR /app
# 项目结构要求: server/、public/、terrain-*.json（Room.js 读取对应地形蒙版，index.js 托管 ../public）
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server ./server
COPY public ./public
COPY terrain*.json ./
WORKDIR /app/server
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["npm", "start"]
