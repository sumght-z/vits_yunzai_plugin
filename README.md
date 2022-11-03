# vits_yunzai_plugin

#### 介绍
AI语音本地生成并发送的yunzai插件

#### 安装须知
1.  请确保你的环境存在python3.6+
    原则上vits的环境是python3.6+，插件作者使用的是3.7和3.8版本。
2.  pip安装环境时，最好是换为清华源（自行百度），保证安装环境不断连。
3.  生成语音报错请仔细看抛出的报错信息，并提交issues或者是在群里询问。目前版本尚在测试阶段。


#### 安装教程

1.  yunzai根目录下输入
   `git clone https://gitee.com/sumght/vits_yunzai_plugin.git ./plugins/vits-yunzai-Plugin/`
2.  将ys.pth权重文件放入本目录文件夹下vits/ys/目录下
    下载地址:
    `https://pan.baidu.com/s/1Q4ujpNn56ZI_Caort5aIeg?pwd=rr4j`
3.  文件夹cd至本插件目录文件夹下 /vits，执行
    `pip install -r requirements.txt`
    安装环境

#### 使用说明

1.  输入音色列表即可查看可输出角色
2.  输入xxx说xxxx即可生成对应语句

#### 常见问题
1.  ModuleNotFoundError: No module named 'monotonic_align.monotonic_align.core'
    解决方法：在vits的目录下，
    `cd monotonic_align`
    `python setup.py build_ext --inplace`
    等待生成核心即可

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request
