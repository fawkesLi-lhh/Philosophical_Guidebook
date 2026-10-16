#!/usr/bin/env python3
# 由 docs/261014-日记3-哲学演化图谱.md 生成 data/evolution/{viewpoints,tags}.jsonl
# 机械转换：节点→中文观点（key 即语句）+ 标签；mermaid 边→继承/反驳。provenance 如实标注编辑层。
import json, io, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'evolution')
os.makedirs(OUT, exist_ok=True)

# ---- 标签（人/学派/书/时期），years 尽量准确，不确定留空 ----
tags = [
 {"key":"古希腊源头","kind":"period","parents":[],"note":"演化图 ROOT，c. 600–300 BCE"},
 {"key":"毕达哥拉斯与柏拉图","kind":"person","parents":["古希腊源头"],"years":"c.-570–-347"},
 {"key":"欧几里得与阿基米德","kind":"person","parents":["古希腊源头"],"years":"c.-300–-212"},
 {"key":"德谟克利特与伊壁鸠鲁","kind":"person","parents":["古希腊源头"],"years":"c.-460–-270"},
 {"key":"亚里士多德","kind":"person","parents":["古希腊源头"],"years":"-384–-322"},
 {"key":"花拉子米","kind":"person","parents":[],"years":"c.780–850"},
 {"key":"阿奎那","kind":"person","parents":[],"years":"1225–1274"},
 {"key":"奥卡姆","kind":"person","parents":[],"years":"c.1287–1347"},
 {"key":"哥白尼","kind":"person","parents":[],"years":"1473–1543"},
 {"key":"开普勒","kind":"person","parents":[],"years":"1571–1630"},
 {"key":"伽利略","kind":"person","parents":[],"years":"1564–1642"},
 {"key":"笛卡尔","kind":"person","parents":[],"years":"1596–1650"},
 {"key":"斯宾诺莎","kind":"person","parents":[],"years":"1632–1677"},
 {"key":"莱布尼茨","kind":"person","parents":[],"years":"1646–1716"},
 {"key":"牛顿","kind":"person","parents":[],"years":"1643–1727"},
 {"key":"康德","kind":"person","parents":[],"years":"1724–1804"},
 {"key":"麦克斯韦","kind":"person","parents":[],"years":"1831–1879"},
 {"key":"玻尔兹曼","kind":"person","parents":[],"years":"1844–1906"},
 {"key":"弗雷格","kind":"person","parents":[],"years":"1848–1925"},
 {"key":"维特根斯坦","kind":"person","parents":[],"years":"1889–1951"},
 {"key":"哥德尔","kind":"person","parents":[],"years":"1906–1978"},
 {"key":"图灵","kind":"person","parents":[],"years":"1912–1954"},
 {"key":"香农","kind":"person","parents":[],"years":"1916–2001"},
 {"key":"维纳","kind":"person","parents":[],"years":"1894–1964"},
 {"key":"波普尔","kind":"person","parents":[],"years":"1902–1994"},
 {"key":"库恩","kind":"person","parents":[],"years":"1922–1996"},
 {"key":"黑格尔","kind":"person","parents":[],"years":"1770–1831"},
 {"key":"胡塞尔","kind":"person","parents":[],"years":"1859–1938"},
 {"key":"海德格尔","kind":"person","parents":[],"years":"1889–1976"},
 {"key":"萨特","kind":"person","parents":[],"years":"1905–1980"},
 {"key":"德里达","kind":"person","parents":[],"years":"1930–2004"},
 {"key":"费尔巴哈","kind":"person","parents":[],"years":"1804–1872"},
 {"key":"马克思恩格斯","kind":"person","parents":[],"years":"1818–1883 / 1820–1895","note":"复合人：合著按一书一人归属"},
 {"key":"列宁","kind":"person","parents":[],"years":"1870–1924"},
 {"key":"法兰克福学派","kind":"school","parents":[],"note":"霍克海默/阿多诺；含阿尔都塞的西马扩展"},
 {"key":"麦卡洛克皮茨","kind":"person","parents":[],"years":"1898–1969 / 1924–1969","note":"复合人"},
 {"key":"古代原子论","kind":"school","parents":[]},
 {"key":"理性主义","kind":"school","parents":[]},
 {"key":"经验主义","kind":"school","parents":[]},
 {"key":"分析哲学","kind":"school","parents":[]},
 {"key":"现象学","kind":"school","parents":[]},
 {"key":"存在主义","kind":"school","parents":[]},
 {"key":"西方马克思主义","kind":"school","parents":[]},
 {"key":"科学哲学","kind":"school","parents":[]},
 # 演化图 md 本身建模为一本书（作者=用户，纲要类）
 {"key":"哲学演化图谱（纲要）","kind":"book","parents":["用户"],"note":"docs/261014-日记3-哲学演化图谱.md"},
 {"key":"用户","kind":"person","parents":[],"note":"演化图作者，编辑层"},
]

def vp(key, year, parents, inherits=None, refutes=None, anchors=None, note=""):
    # F-6 v2：引用是裸字符串，目标由字段名决定——parents→tags，inherits/refutes→viewpoints
    return {"key":key,"parents":list(parents),
            "inherits":list(inherits or []),
            "refutes":list(refutes or []),
            "year":year,
            "anchors":[{"file":"texts/261014-日记3-哲学演化图谱.md","p":a} for a in (anchors or [])],
            "provenance":"editor:user-evolution-md","note":note}

# ---- 观点：key = 节点描述句（中文）；year = 该节点主题代表年 ----
V = []
V.append(vp("万物皆数：数的比例构成宇宙秩序", -530, ["毕达哥拉斯与柏拉图"],
            note="毕达哥拉斯学派与柏拉图理念论的数本原"))
V.append(vp("公理化方法：从不证自明的公理出发演绎整个知识体系", -300, ["欧几里得与阿基米德"],
            note="几何原本；阿基米德力学与穷竭法"))
V.append(vp("古代原子论：万物由原子与虚空构成", -400, ["德谟克利特与伊壁鸠鲁","古代原子论"],
            note="德谟克利特创、伊壁鸠鲁发展、卢克莱修诗化传播"))
V.append(vp("三段论：演绎推理的形式规则", -350, ["亚里士多德"],
            note="工具论；质性定性描述传统"))
V.append(vp("代数可以脱离几何独立成算法", 830, ["花拉子米"],
            note="还原与对消的算法化代数"))
V.append(vp("理性神学：信仰与理性可以调和", 1265, ["阿奎那"],
            note="神学大全五路证明"))
V.append(vp("如无必要，勿增实体", 1323, ["奥卡姆"],
            note="奥卡姆剃刀；唯名论清理共相"))
V.append(vp("日心说：太阳居于宇宙中心，地球是行星之一", 1543, ["哥白尼"],
            note="天体运行论"))
V.append(vp("行星轨道是椭圆，面积定律统摄运动", 1609, ["开普勒"],
            note="新天文学三定律"))
V.append(vp("数学描述自然语言，实验是检验标准", 1610, ["伽利略"],
            note="星际信使起，两门新科学确立"))
V.append(vp("我思故我在：怀疑一切时，怀疑者存在不可怀疑", 1637, ["笛卡尔","理性主义"],
            anchors=[("1637-笛卡尔-方法论.md","0117")],
            note="方法论第四部；第一哲学原理"))
V.append(vp("实体即自因：神或自然是唯一实体", 1677, ["斯宾诺莎","理性主义"],
            note="伦理学几何式证明"))
V.append(vp("普遍文字与微积分：思维可化为符号运算", 1666, ["莱布尼茨"],
            note="论组合术；单子论"))
V.append(vp("经典力学统一天地：三大定律与万有引力，微积分成为物理语言【第一次大收复】", 1687, ["牛顿"],
            inherits=["公理化方法：从不证自明的公理出发演绎整个知识体系","日心说：太阳居于宇宙中心，地球是行星之一","行星轨道是椭圆，面积定律统摄运动","数学描述自然语言，实验是检验标准","普遍文字与微积分：思维可化为符号运算"],
            note="自然哲学的数学原理"))
V.append(vp("批判哲学：知识限于可能经验，物自体不可知", 1781, ["康德"],
            refutes=["经典力学统一天地：三大定律与万有引力，微积分成为物理语言【第一次大收复】"],
            anchors=[("1781-康德-纯粹理性批判.md","0031")],
            note="纯粹理性批判；牛顿体系引发的认识论转向"))
V.append(vp("电磁场方程组：光即电磁波，场成为物理实在", 1873, ["麦克斯韦"],
            note="电磁通论"))
V.append(vp("统计力学与熵：宏观规律源于微观统计", 1896, ["玻尔兹曼"],
            note="气体理论讲义"))
V.append(vp("概念文字：一阶谓词逻辑，数学可归约为逻辑", 1879, ["弗雷格"],
            inherits=["三段论：演绎推理的形式规则"],
            note="Begriffsschrift"))
V.append(vp("数学基础三方案：逻辑主义、形式主义、直觉主义", 1900, ["弗雷格","希尔伯特","布劳威尔"],
            note="20世纪初论战"))
V.append(vp("逻辑原子论：世界由事实构成，命题是事实的图像", 1922, ["维特根斯坦"],
            note="逻辑哲学论"))
V.append(vp("不完备定理：包含算术的一致系统必存在不可判定命题【系统挫折】", 1931, ["哥德尔"],
            refutes=["数学基础三方案：逻辑主义、形式主义、直觉主义"],
            note="论数学原理及相关系统的形式不可判定命题"))
V.append(vp("可计算性：图灵机界定机械可计算", 1936, ["图灵"],
            inherits=["不完备定理：包含算术的一致系统必存在不可判定命题【系统挫折】"],
            note="论可计算数"))
V.append(vp("信息论：信息可量化为比特，通信有数学极限", 1948, ["香农"],
            note="通信的数学理论"))
V.append(vp("控制论：机器与生物同用反馈调节【第二次大收复】", 1948, ["维纳"],
            note="Cybernetics"))
V.append(vp("可证伪性：科学命题必须可能被经验反驳", 1934, ["波普尔"],
            refutes=["逻辑原子论：世界由事实构成，命题是事实的图像"],
            note="科学发现的逻辑"))
V.append(vp("范式转移：科学革命是范式整体更替而非积累", 1962, ["库恩"],
            refutes=["可证伪性：科学命题必须可能被经验反驳"],
            note="科学革命的结构"))
V.append(vp("辩证法：历史按正反合螺旋展开", 1812, ["黑格尔"],
            note="逻辑学"))
V.append(vp("现象学还原：回到事物本身，意识总是关于某物的意识", 1900, ["胡塞尔"],
            refutes=["批判哲学：知识限于可能经验，物自体不可知"],
            note="逻辑研究；不预设物自体不可知"))
V.append(vp("存在问题先于一切：此在在世界中，存在无法公式化", 1927, ["海德格尔"],
            inherits=["辩证法：历史按正反合螺旋展开","现象学还原：回到事物本身，意识总是关于某物的意识"],
            note="存在与时间"))
V.append(vp("存在先于本质：人被判处自由", 1943, ["萨特"],
            inherits=["存在问题先于一切：此在在世界中，存在无法公式化"],
            note="存在与虚无"))
V.append(vp("解构主义：文本无中心，意义无限延异", 1967, ["德里达"],
            refutes=["存在问题先于一切：此在在世界中，存在无法公式化"],
            note="论文字学"))
V.append(vp("人本学唯物主义：神学的秘密是人本学", 1841, ["费尔巴哈"],
            inherits=["古代原子论：万物由原子与虚空构成"],
            note="基督教的本质"))
V.append(vp("历史唯物主义：社会存在决定社会意识", 1848, ["马克思恩格斯"],
            inherits=["辩证法：历史按正反合螺旋展开","人本学唯物主义：神学的秘密是人本学"],
            anchors=[("1848-马克思恩格斯-共产党宣言.md","0121")],
            note="德意志意识形态、共产党宣言"))
V.append(vp("唯物主义反映论：物质第一性，真理是客观的", 1908, ["列宁"],
            inherits=["历史唯物主义：社会存在决定社会意识"],
            note="唯物主义和经验批判主义"))
V.append(vp("批判理论：启蒙辩证法，工具理性自我毁灭", 1947, ["法兰克福学派"],
            inherits=["辩证法：历史按正反合螺旋展开","历史唯物主义：社会存在决定社会意识"],
            refutes=["启蒙即进步的线性史观"],
            note="启蒙辩证法"))
V.append(vp("启蒙即进步的线性史观", 1784, ["康德"],
            note="编辑层概括节点（目标靶）；为批判理论的反驳边提供落点"))
V.append(vp("MP神经元：神经活动可用布尔逻辑演算", 1943, ["麦卡洛克皮茨"],
            inherits=["可计算性：图灵机界定机械可计算","信息论：信息可量化为比特，通信有数学极限"],
            note="神经活动内在观念的逻辑演算"))
V.append(vp("复杂系统与AI对旧哲学概念的全面收复：普遍联系→网络、量变质变→相变涌现、对立统一→博弈对抗、意向性→向量空间", 2024, [],
            inherits=["控制论：机器与生物同用反馈调节【第二次大收复】","MP神经元：神经活动可用布尔逻辑演算","范式转移：科学革命是范式整体更替而非积累","辩证法：历史按正反合螺旋展开","唯物主义反映论：物质第一性，真理是客观的"],
            refutes=["存在问题先于一切：此在在世界中，存在无法公式化"],
            note="当代前沿节点，md 虚线：被收复/被挑战"))
V.append(vp("阿尔都塞：意识形态没有历史，结构决定主体", 1965, ["法兰克福学派"],
            inherits=["历史唯物主义：社会存在决定社会意识"],
            note="保卫马克思；结构马克思主义"))
V.append(vp("弗雷格-罗素悖论与逻辑主义纲领", 1902, ["弗雷格"],
            inherits=["概念文字：一阶谓词逻辑，数学可归约为逻辑"],
            refutes=["概念文字：一阶谓词逻辑，数学可归约为逻辑"],
            note="罗素悖论动摇逻辑主义基础；同年前后"))

# 修正：V 里 inherits 的对象如「希尔伯特」「布劳威尔」等 tag key 引用不存在——改成对观点的引用
# 处理方式：数学基础三方案的 parents 里去掉不存在的 person tag，改为 note 说明；同时删除弗雷格-罗素悖论对自身的反驳（自查发现的数据错误）
by_key = {v["key"]: v for v in V}
V = [v for v in V if v["key"] != "弗雷格-罗素悖论与逻辑主义纲领"]
for v in V:
    if v["key"] == "数学基础三方案：逻辑主义、形式主义、直觉主义":
        v["parents"] = ["弗雷格"]
        v["note"] = "20世纪初论战：逻辑主义（弗雷格/罗素）、形式主义（希尔伯特）、直觉主义（布劳威尔）"


# MP 神经元(1943) 不能继承 1948 信息论（时间倒流，史实亦否）——只保留图灵可计算性
for v in V:
    if v["key"].startswith("MP神经元"):
        v["inherits"] = [k for k in v["inherits"] if not k.startswith("信息论")]

# 启蒙即进步的线性史观 parents 挂康德没问题；把 tag 康德的 parents 补学派（无强学派，留空）

with io.open(os.path.join(OUT,'viewpoints.jsonl'),'w',encoding='utf-8',newline='\n') as f:
    for v in V:
        f.write(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n')
with io.open(os.path.join(OUT,'tags.jsonl'),'w',encoding='utf-8',newline='\n') as f:
    for t in tags:
        f.write(json.dumps(t,ensure_ascii=False,separators=(',',':'))+'\n')
print(f"viewpoints={len(V)} tags={len(tags)}")
