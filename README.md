# vits_yunzai_plugin

#### 介绍
AI语音本地生成原神/崩三语音并发送的yunzai插件

#### 安装须知
1.  请确保你的环境存在python3.6+
    原则上vits的环境是python3.6+，插件作者本机使用的是3.7版本，云服务器用的3.8版本
2.  如果不确定是哪个依赖有问题，可以开启机器人，发送指令让它尝试生成，它会抛出错误。
3.  生成语音报错请仔细看抛出的报错信息，并提交issues或者是在群里询问。目前版本尚在测试阶段，擅于面向百度编程.jpg
4.  现已支持显卡推演，速度提高30-50倍，实测单核cpu推演生成189字句子需要6min，RTX2060显卡只需要3-5秒即可生成。开启gpu推演需要你有显卡和正确安装对应版本cuda，输入开启gpu/关闭gpu。



#### 安装教程

1.  yunzai根目录下输入
    ```
    git clone https://github.com/sumght-z/vits_yunzai_plugin.git ./plugins/vits-yunzai-Plugin/
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
    安装环境

#### 使用说明

1.  输入音色列表即可查看可输出角色
2.  输入xxx说xxxx即可生成对应语句

    原神音色，支持别称:

    派蒙,凯亚,安柏,丽莎,琴,香菱,枫原万叶,迪卢克,温迪,可莉,早柚,托马,芭芭拉,优菈,云堇,钟离,魈,凝光,雷电将军,北斗,甘雨,七七,刻晴,神里绫华,戴因斯雷布,雷泽,神里绫人,罗莎莉亚,阿贝多,八      重神子,宵宫,荒泷一斗,九条裟罗,夜兰,珊瑚宫心海,五郎,散兵,女士,达达利亚,莫娜,班尼特,申鹤,行秋,烟绯,久岐忍,辛焱,砂糖,胡桃,重云,菲谢尔,诺艾尔,迪奥娜,鹿野院平藏

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
    下载如果很慢，请自行调整为清华源。
    具体原因是这个1.6.0的torch版本比较老了，需要去pytorch历史里翻出来下载。
    确定安装好后，去requirements.txt删去
    ```
    torch==1.6.0
    torchvision==0.7.0
    ```
    后继续安装环境。
    
3.  ERROR: Failed building wheel for pyopenjtalk
    
    openjtalk的问题会出现在win用户上，linux则可以直接安装
    win用户解决方法查看https://www.bilibili.com/video/BV13t4y1V7DV
    
4.  linux用户安装pyopenjtalk出问题
    ```
    raise CalledProcessError(self.returncode, self.args, self.stdout,
    subprocess.CalledProcessError: Command '['cmake', '..', '-DHTS_ENGINE_INCLUDE_DIR=.', '-DHTS_ENGINE_LIB=dummy']' returned non-zero exit status 1.
    [end of output]

    note: This error originates from a subprocess, and is likely not a problem with pip.
    error: subprocess-exited-with-error
    ```
    参考https://blog.csdn.net/qq_33882464/article/details/126677559
    
5.  更多pyopenjtalk问题

    参考原地址https://pypi.org/project/pyopenjtalk/
    
    
#### 其他
[gitee地址](https://gitee.com/sumght/vits_yunzai_plugin/tree/master)
预计下次更新会加入崩坏三人物语音生成，新的模型正在加紧炼制。

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
