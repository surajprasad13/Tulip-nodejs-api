export const getFreeLCDashboard = async(user_answers: any, dashboard_reference: any) => { 
    
    let health_insights = user_answers.reduce((acc: any, el: any) => {
        const dash = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        if(dash.length > 0) {
            dash.forEach((element: any) => {
                if (element.root_cause?.length > 0) {
                    acc = acc.concat(element.root_cause)
                }
            })
        }
        return acc
    },[])

    const randomIndex = Math.floor(Math.random() * health_insights.length);
    const randomElement = health_insights[randomIndex];

    return {health_insights: randomElement}
}