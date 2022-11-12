# vits_yunzai_plugin

#### 介绍
AI语音本地生成原神/崩三语音并发送的yunzai插件

qq群：433567006 （由于崩三模型还在不停炼，懒得每次都上传网盘，将在qq群里更新）

#### 安装须知
1.  请确保你的环境存在python3.6+
    原则上vits的环境是python3.6+，插件作者本机使用的是3.7版本，云服务器用的3.8版本
2.  如果不确定是哪个依赖有问题，可以开启机器人，发送指令让它尝试生成，它会抛出错误。
3.  生成语音报错请仔细看抛出的报错信息，并提交issues或者是在群里询问。目前版本尚在测试阶段，擅于面向百度编程.jpg
4.  现已支持显卡推演，速度提高30-50倍，实测单核cpu推演生成189字句子需要6min，RTX2060显卡只需要3-5秒即可生成。开启gpu推演需要你有显卡和正确安装对应版本cuda，输入开启gpu/关闭gpu。
5.  测试目前安装情况，需要查漏补缺，在yunzai根目录下运行
    ```
    python ./plugins/vits-yunzai-Plugin/vits/run_new.py --character=0 --text=你好啊，做一个测试。
    ```
    它会告诉你现在哪个包缺失。然后根据报错去常见问题查看解决方案。也可以自行进行判断，输入 pip list 查看当前环境依赖安装情况。


#### 安装教程

1.  yunzai根目录下输入
    ```
    git clone https://gitee.com/sumght/vits_yunzai_plugin.git ./plugins/vits-yunzai-Plugin/
    ```
2.  将ys.pth权重文件放入本目录文件夹下vits/ys/目录下
    下载地址:
    ```
    https://pan.baidu.com/s/1Q4ujpNn56ZI_Caort5aIeg?pwd=rr4j
    ```
    将bh3.pth权重文件放入本目录文件夹下vits_bh3/bh3/目录下
    ```
    https://pan.baidu.com/s/1_fC21h229_Z-tirp_9C7xQ?pwd=2pv3
    ```
3.  文件夹cd至本插件目录文件夹下 /vits，执行
    ```
    pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    ```
    安装环境，在安装过程中如果报错，根据常见问题和issues解决问题后，重复执行步骤3，直到环境完全安装完毕。

#### 使用说明

1.  输入音色列表即可查看可输出角色
2.  输入xxx说xxxx即可生成对应语句

    原神音色，支持别称:

    派蒙,凯亚,安柏,丽莎,琴,香菱,枫原万叶,迪卢克,温迪,可莉,早柚,托马,芭芭拉,优菈,云堇,钟离,魈,凝光,雷电将军,北斗,甘雨,七七,刻晴,神里绫华,戴因斯雷布,雷泽,神里绫人,罗                        莎莉亚,阿贝多,八重神子,宵宫,荒泷一斗,九条裟罗,夜兰,珊瑚宫心海,五郎,散兵,女士,达达利亚,莫娜,班尼特,申鹤,行秋,烟绯,久岐忍,辛焱,砂糖,胡桃,重云,菲谢尔,诺艾尔,迪奥娜,鹿    野院平藏

    崩坏三音色,不支持别称：

    丽塔,伊甸,八重樱,卡莲,卡萝尔,姬子,布洛妮娅,希儿,帕朵菲莉丝,幽兰黛尔,德丽莎,格蕾修,梅比乌斯,渡鸦,爱莉希雅,琪亚娜,符华,维尔薇,芽衣,阿波尼亚,空律,识律
    
    柚子社音色:（接口实现）

    绫地宁宁,因幡巡,朝武芳乃,常陆茉子,丛雨,鞍马小春,在原七海

    其他音色:（接口实现）

    星爷,鬼,葛优,四川话,粤语,loli,东北话,然然

    格式: 音色+说+要说的话

#### 常见问题
1.  ModuleNotFoundError: No module named 'monotonic_align.monotonic_align.core'
    解决方法：在vits和vits_bh3两个目录下，分别都执行，
    ```
    cd monotonic_align
    ```
    ```
    python setup.py build_ext --inplace
    ```
    等待生成核心即可

2.  ERROR: No matching distribution found for torch==1.6.0      
    解决方法：如果有conda
    ```
    conda install pytorch==1.6.0 torchvision==0.7.0 cpuonly -c pytorch
    ```
    如果没有conda，就用pip
    ```
    pip install torch==1.6.0+cpu torchvision==0.7.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
    ```    
  
    具体原因是这个1.6.0的torch版本比较老了，需要去pytorch历史里翻出来下载。
    确定安装好后，去requirements.txt删去
    ```
    torch==1.6.0
    torchvision==0.7.0
    ```
    后继续安装环境。

# pyopenjtalk安装（依然是常见问题里的，常见问题不止上面三个，接着往下看）
#### 极为重要，百分之90的人都是这儿卡壳，仔细查看
3. window用户安装pyopenjtalk
    win用户解决方法查看https://www.bilibili.com/video/BV13t4y1V7DV
    现在更新也更简单的方法，请查看https://gitee.com/sumght/vits_yunzai_plugin/issues/I6088Z 直接下载编译好的文件开箱即用

4.  linux用户安装pyopenjtalk (感谢[@xi-yun](https://gitee.com/xi-yun)提供)

    环境Ubuntu20.04，python3.8.10
    安装步骤：

    1.安装cmake
    ```
    apt install cmake
    ```
    2.安装依赖库
    ```
    sudo apt-get install build-essential python3-dev libssl-dev libffi-dev libxml2 libxml2-dev libxslt1-dev zlib1g-dev
    ```
    参考[文章](https://blog.csdn.net/weixin_42912498/article/details/108443386)

    3.升级pip
    ```
    python -m pip install --upgrade pip
    ```
    4.安装pyopenjtalk
    ```
    pip install pyopenjtalk==0.2.0
    ```

5.  更多pyopenjtalk问题

    参考原地址https://pypi.org/project/pyopenjtalk/

6.  出现
    ```
    OSError: cannot load library 'libsndfile.so': libsndfile.so: cannot open shared object file: No such file or directory
    ```
    等一系列关于libsndfile的问题
    解决方法：https://www.jianshu.com/p/cc1a10a79cfa

    缺少libsndfile，查看 SoundFile官网，发现需要安装libsndfile

7.  如果出现没报错或者是显示着成功但是不生成的情况，去yunzai根目录运行指令
    ```
    python ./plugins/vits-yunzai-Plugin/vits/run_new.py --character=0 --text=你好啊，做一个测试。
    ```
    看看那儿有没有报错，yunzai根目录有没有生成example.wav

8.  安装过霄鸟插件的，因为霄鸟有个自己的虚拟环境，导致你安装了包，但是依然会报没安装环境的错误。需要自己找到你环境安装好了的这个python位置，去手动添加全局变量path，
    不然怎么装都是报没有装环境。

#### 其他
[gitee地址](https://gitee.com/sumght/vits_yunzai_plugin/tree/master)
预计下次更新会加入崩坏三人物语音生成，新的模型正在加紧炼制。

# 安装查询
####（上述安装过程差啥东西，自行在这儿查询，比如你发现你python版本不对又不会安装，那么就来这儿查看）
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
