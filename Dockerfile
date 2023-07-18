FROM nginx

RUN mkdir -p /home/wenda-webui
# 指定路径
WORKDIR /home/wenda-webui
# 复制conf文件到路径
COPY nginx.conf /etc/nginx/nginx.conf
# 复制html文件到路径
COPY dist-pro /home/wenda-webui
#将dist目录内容复制到nginx容器html内部
#COPY dist-pro /usr/share/nginx/html/

EXPOSE 80
