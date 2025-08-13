document.getElementById('kimiBtn').addEventListener('click', function() {
    const userInput = document.getElementById('kimiInput').value.trim();
    if (!userInput) {
        alert('请输入要分析的内容');
        return;
    }
    
    const prefix = ' 仔细阅读这个链接中的内容。\n接下来，扮演一名知识整理专家，把我提供的知识文章整理成知识和案例卡片。\n## 背景信息\n目标读者均为该领域的小白新手，你在把文章中内容整理成卡片文字时，**务必确保表达方式通俗易懂**，**务必保留文章中的金句**。\n## 整理要求\n- 使用金字塔原理对知识文章进行提炼概括，如果原文不是金字塔结构则进行重构\n- 确保文章中的关键信息都被整理到知识卡片中\n- 确保每张卡片中各段信息之间、卡片知识与卡片知识之间具备连贯性\n- 对知识点进行展开介绍时，确保信息的通俗易懂，避免使用专业术语\n- 输出纯文本内容，不要包含任何标识符。\n## 输出结构\n将信息以 JSON 格式输出。\n参考如下结构\n{"CoverCard": {"title": "组卡片的标题，优先使用疑问句，简洁具有吸引力","abstract":"文章核心内容，300字以内"},"detailCards": [{"title": "第一张卡片的标题，12字以内","knowledgePoints": {"point1": "第一个知识点的小标题，20字以内","point1_desc":"第一个知识点的展开介绍，不超过99字","point2": "第二个知识点的小标题，20字以内","point2_desc":"第二个知识点的展开介绍，不超过99字","point3": "第三个知识点的小标题，20字以内","point3_desc":"第三个知识点的展开介绍，不超过99字"}},{"title": "第二张卡片的标题，12字以内","knowledgePoints": {"point1": "第一个知识点的小标题，20字以内","point1_desc":"第一个知识点的展开介绍，不超过99字","point2": "第二个知识点的小标题，20字以内","point2_desc":"第二个知识点的展开介绍，不超过99字","point3": "第三个知识点的小标题，20字以内","point3_desc":"第三个知识点的展开介绍，不超过99字"}}]}';
    const fullPrompt = encodeURIComponent(userInput + prefix);
    const kimiUrl = `https://kimi.moonshot.cn/_prefill_chat?prefill_prompt=${fullPrompt}&send_immediately=true&force_search=true`;
    
    window.open(kimiUrl, '_blank');
});

document.getElementById('convertBtn').addEventListener('click', function() {
    const jsonInput = document.getElementById('jsonInput').value;
    try {
        const jsonData = JSON.parse(jsonInput);
        renderCards(jsonData);
    } catch (e) {
        alert('Please enter a valid JSON structure.');
    }
});
document.getElementById('generatePicBtn').addEventListener('click', async function() {
    const cards = document.querySelectorAll('.card');
    const pictureArea = document.getElementById('pictureArea');
    pictureArea.innerHTML = '';
    
    // 预加载所有背景图片
    const preloadImages = async () => {
        const imageUrls = [
            'assets/img/thumb1/cover-card.png',
            'assets/img/thumb1/detail-card.png'
        ];
        
        const loadImage = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = url;
            });
        };
        
        try {
            await Promise.all(imageUrls.map(loadImage));
            console.log('All background images loaded');
        } catch (error) {
            console.error('Failed to load background images:', error);
        }
    };
    
    // 等待背景图片加载完成
    await preloadImages();
    
    // 逐个渲染卡片
    for (let index = 0; index < cards.length; index++) {
        try {
            const canvas = await html2canvas(cards[index], {
                width: 300,
                height: 400,
                scale: 4,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                onclone: function(clonedDoc) {
                    const clonedCard = clonedDoc.querySelector('.card');
                    if (clonedCard) {
                        // 保持原始样式
                        const originalCard = cards[index];
                        clonedCard.style.cssText = window.getComputedStyle(originalCard).cssText;
                    }
                }
            });

            const wrapper = document.createElement('div');
            wrapper.className = 'card-image-wrapper';
            wrapper.appendChild(canvas);
            pictureArea.appendChild(wrapper);
            
            // 添加日志确认渲染完成
            console.log(`Card ${index} rendered successfully`);
        } catch (error) {
            console.error(`Failed to render card ${index}:`, error);
        }
    }

    // 添加下载按钮
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.className = 'download-all-btn btn-primary';
    downloadAllBtn.textContent = '下载全部图片';
    pictureArea.appendChild(downloadAllBtn);
    
    downloadAllBtn.addEventListener('click', function() {
        const canvases = document.querySelectorAll('.card-image-wrapper canvas');
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, ''); // 获取当前时间并格式化
        const jsonData = JSON.parse(document.getElementById('jsonInput').value); // 获取 JSON 数据
        
        // 创建文本内容
        const textContent = `标题: ${jsonData.CoverCard.title}\n摘要: ${jsonData.CoverCard.abstract}\n`;
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        const textLink = document.createElement('a');
        textLink.download = `card-info-${timestamp}.txt`; // 文本文件名
        textLink.href = URL.createObjectURL(textBlob);
        document.body.appendChild(textLink);
        textLink.click();
        document.body.removeChild(textLink);
        URL.revokeObjectURL(textLink.href);
        
        canvases.forEach((canvas, index) => {
            try {
                canvas.toBlob(function(blob) {
                    if (blob) {
                        const link = document.createElement('a');
                        link.download = `card-${timestamp}-${index + 1}.png`; // 修改文件名以包含日期、时间和序号
                        link.href = URL.createObjectURL(blob);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                    }
                }, 'image/png');
            } catch (error) {
                console.error(`Failed to download card ${index}:`, error);
            }
        });
    });
});

function renderCards(data) {
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = ''; // Clear previous cards

    // Render Cover Card
    if (data.CoverCard) {
        const coverCard = createCard(data.CoverCard, 'cover-card');
        previewArea.appendChild(coverCard);
    }

    // Render Introduction Card
    if (data.introduction) {        
        const introCard = createCard(data.introduction, 'introduction-card');
        previewArea.appendChild(introCard);
    }

    // Render Detail Cards
    if (data.detailCards) {
        data.detailCards.forEach((cardData, index) => {
            const detailCard = createCard(cardData, 'detail-card');
            previewArea.appendChild(detailCard);
        });
    }
    
}

function createCard(data, cardType) {
    const card = document.createElement('div');
    card.className = `card ${cardType}`;
    const selectedTemplate = document.getElementById('templateSelector').value; // 获取选中的模板

    if (cardType === 'cover-card') {
        card.innerHTML = `
            <div class="cover-card-content">
                <div class="card-title">${data.title}</div>
            </div>
            <div class="cover-card-bg">
                <img src="assets/img/thumb1/cover-card-${selectedTemplate}.png"> <!-- 根据模板选择图片 -->
            </div>
        `;
    } else if (cardType === 'introduction-card') {
        card.innerHTML = `
            <div class="card-det-title">${data.title}</div>
            <div class="textbox bg-black-500 p-2 textbox-intro">${data.introduction}</div>
        `;
    } else if (cardType === 'detail-card') {
        // 先创建基础结构
        let cardContent = `
            <div class="detail-card-content">
                <div class="card-title">${data.title}</div>
        `;
        
        // 动态生成知识点内容
        for (let key in data.knowledgePoints) {
            if (key.startsWith('point') && key.endsWith('_desc')) continue; // 跳过描述，我们在处理point时一并处理
            
            const pointNumber = key.replace('point', '');
            const descKey = `point${pointNumber}_desc`;
            
            if (data.knowledgePoints[descKey]) {
                cardContent += `
                    <div class="card-item">
                        <div class="card-subtitle">${data.knowledgePoints[key]}</div>
                        <div class="card-subcontent">${data.knowledgePoints[descKey]}</div>
                    </div>
                `;
            }
        }
        
        // 添加背景图
        cardContent += `
            </div>
            <div class="detail-card-bg">
                <img src="assets/img/thumb1/detail-card-${selectedTemplate}.png"> <!-- 根据模板选择图片 -->
            </div>
        `;
        
        card.innerHTML = cardContent;
    }
    return card;
}
