// Export weather data
export function getData(url) {
    return fetch(url)
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        return data;
    });
}