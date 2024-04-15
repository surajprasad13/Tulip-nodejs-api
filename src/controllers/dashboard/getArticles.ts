export const getArticles = async(user_answers: any, dashboard_reference: any, presets: any) => { 
    let preset_ids = user_answers.reduce((acc: any, el: any) => {
        const dash = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        if(dash.length > 0) {
            dash.forEach((element: any) => {
                if (element?.preset_ids?.length > 0) {
                    acc = acc.concat(element.preset_ids.split(","))
                }
            })
        }
        return acc
    },[])
    const articles = preset_ids.reduce((acc: any, el: any) => {
        const article = presets.filter((item: any) => item.preset_id.toString().trim() == el)
        if(article.length > 0) {
            article.forEach((element: any) => {
                if ((element?.remedy_type == 'article' || element?.remedy_type == 'video') && element?.remedy_id) {
                    acc[element.remedy_type] = acc[element.remedy_type].concat(element.remedy_id)
                }
            })
        }
        return acc
    },{article: [], video: []})

    articles['article'] = articles['article']
                            .filter((value: any, index: any, self: any) => {
                                return self.indexOf(value) === index;
                            })
                            .sort(() => Math.random() - 0.5)
    articles['video'] = articles['video']
                            .filter((value: any, index: any, self: any) => {
                                return self.indexOf(value) === index;
                            })
                            .sort(() => Math.random() - 0.5)
    articles['article'] = articles['article'].slice(0, 4)
    articles['video'] = articles['video'].slice(0, 4).concat([164, 165, 166, 168]).sort(() => Math.random() - 0.5)

    return articles
}