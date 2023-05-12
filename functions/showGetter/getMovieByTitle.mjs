import fetch from 'node-fetch';
import querystring from 'querystring';

export const handler = async(event) => {

    const params = {
        title: 'batman',
        country: 'us',
        show_type: 'movie',
        output_language: 'en'
    };

    // TODO: Replace API Keys!!!
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '499a699677msh1b90fd67fff45e8p15a888jsn465885355eb3',
            'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
        }
    };

    //TODO: Change API to basic search instead of title
    try {
        const response = await fetch(`https://streaming-availability.p.rapidapi.com/v2/search/title?${querystring.stringify(params)}`, options);
        const body = await response.json();

        return {
            statusCode: 200,
            body: body
        }
    } catch (error) {
        console.log(error)
        return {
            statusCode: 500,
            body: error
        }
    }
}
