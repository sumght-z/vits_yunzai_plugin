# vits_yunzai_plugin

#### 介绍
AI语音本地生成并发送的yunzai插件

#### 安装须知
1.  请确保你的环境存在python3.6+
    原则上vits的环境是python3.6+，插件作者使用的是3.7版本。
2.  pip安装环境时，最好是换为清华源（自行百度），保证安装环境不断连。
3.  生成语音报错请仔细看抛出的报错信息，并提交issues或者是在群里询问。目前版本尚在测试阶段。


#### 安装教程

1.  yunzai根目录下输入
   `git clone https://github.com/sumght-z/vits_yunzai_plugin.git ./plugins/vits-yunzai-Plugin/`
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

#### 其他
[gitee地址](https://gitee.com/sumght/vits_yunzai_plugin/tree/master)

# 安装查询（上述安装过程差啥东西，自行在这儿查询，比如你发现你python版本不对又不会安装，那么就来这儿查看）
#### python环境

* 1.安装

  

  * **win用户**

    windows不管之前装没装过，再下一次**python3.7**就行了，我放个python3.7.3的链接

    > https://wwp.lanzoub.com/ioagG0a3xufc
    > 密码:atri

    Add python 3.7 to PATH的√**一定要勾上**

    > 如果是云服务器请需要再安装一个部件https://aka.ms/vs/16/release/vc_redist.x64.exe

  * **centos用户**

    python版本切换到3.7后，需要将yum使用的python再次连接到python2.7

    >  方法：去`/usr/bin/yum`和`/usr/libexec/urlgrabber-ext-down`把第一行的python改成python2或者python2.7

    然后安装一个包

    ```
    yum install libsndfile
    ```

* 2.**检查python版本**！！！！！！(**非常重要**)

  输入`python -V`和`pip -V`

  输出应该是`Python 3.7.3`和`xxxxx (python 3.7)`

* 3.升级pip

  ```
  python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple/
  ```

#### ffmpeg配置

* Windows用户[点我下载ffmpeg](https://wwp.lanzoub.com/ifhhC091vp3a)解压之后放在一个之后不会移动的目录下(**路径中无中文无空格**)

  > **windows2012**请下载：https://pan.baidu.com/s/1VeCe-1z9kKHhH9KD0QRHYA?pwd=atri 
  > 提取码：atri

* 去`Yunzai-Bot\config\config\bot.yaml`里面填写路径

示例：(请复制自己的路径进行配置)**冒号后面有一个空格**！！！！！

```
# ffmpeg
ffmpeg_path: D:\software\ffmpeg\bin\ffmpeg.exe
ffprobe_path: D:\software\ffmpeg\bin\ffprobe.exe
```

> 配置过环境变量的**win用户**建议填写和环境变量路径一样的路径
>
> **linux用户**推荐原码编译后输入`whereis ffmpeg`和`whereis ffprobe`找到ffmpeg的位置
