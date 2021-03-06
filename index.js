const request = require('request');
const rp = require('request-promise');

const headers = {
  "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36"
  };

var cycle = 0;
var refreshDelay = process.env.SCRAPE_INTERVAL;
var currentStock = [];
var newStock = [];

function findRestocks(arr1, arr2, shallowArr1){
  var restocks = [];
  for (i in arr2) {
    if (shallowArr1.includes(arr2[i].id)) {
      var n = shallowArr1.indexOf(arr2[i].id);
      for (j in arr2[i].productInfo) {
        if (arr1[n].productInfo[j] == null) {
          console.log('Monitor cannot find product info in the new scan. Ignoring...');
          break;
        } else {
          for (k in arr2[i].productInfo[j].availableSkus) {
            if (arr1[n].productInfo[j].availableSkus[k].available === false && arr2[i].productInfo[j].availableSkus[k].available === true) {
              restocks.push({
                "thumbnail": arr2[i].productInfo[j].imageUrls.productImageUrl,
                "name": arr2[i].productInfo[j].productContent.title,
                "color": arr2[i].productInfo[j].productContent.colorDescription,
                "currency": arr2[i].productInfo[j].merchPrice.currency,
                "size": '**US **' + arr2[i].productInfo[j].skus[k].nikeSize,
                "price": arr2[i].productInfo[j].merchPrice.currentPrice,
                "link": 'https://www.nike.com/launch/t/' + arr2[i].publishedContent.properties.seo.slug,
                "stylecolor": arr2[i].productInfo[j].merchProduct.styleColor,
                "release": arr2[i].productInfo[j].merchProduct.publishType,
                "hardrelease": arr2[i].productInfo[j].merchProduct.publishType,
                "type": arr2[i].productInfo[j].merchProduct.productType,
                "availabality": arr2[i].productInfo[j].availability.available,
                "stockcount": arr2[i].productInfo[j].availableSkus[k].level,
                "status" : arr2[i].productInfo[j].merchProduct.status 
              });
            }
          }
        }
      }
    } else {
      console.log('Item not found in previous scan. Ignoring...');
    }
  }
  return restocks;
};

function findNewItems(arr2, shallowArr1) {
  var differences = [];
  for (i in arr2) {
    if (!shallowArr1.includes(arr2[i].id)) {
      differences.push({
        "thumbnail": arr2[i].productInfo[0].imageUrls.productImageUrl,
        "name": arr2[i].productInfo[0].productContent.title,
        "color": arr2[i].productInfo[0].productContent.colorDescription,
        "size": '**US **' + arr2[i].productInfo[0].skus[0].nikeSize,
        "price": arr2[i].productInfo[0].merchPrice.currentPrice,
        "currency": arr2[i].productInfo[0].merchPrice.currency,
        "link": 'https://www.nike.com/launch/t/' + arr2[i].publishedContent.properties.seo.slug,
        "stylecolor": arr2[i].productInfo[0].merchProduct.styleColor,
        "release": arr2[i].productInfo[0].merchProduct.publishType,
        "type": arr2[i].productInfo[0].merchProduct.productType,
        "hardrelease": arr2[i].productInfo[0].merchProduct.publishType,
        "stockcount": arr2[i].productInfo[0].availableSkus[0].level,
        "availabality": arr2[i].productInfo[0].availability.available,
        "status" : arr2[i].productInfo[0].merchProduct.status
      });
    }
  };
  return differences;
};

function updates(arr) {
  if (cycle === 0) {
    currentStock = arr;
    console.log('Initial scan complete, ' + currentStock.length + ' items found. Drops and restocks will be checked in the next cycle.');
    console.log(Date());
    console.log(' ');
    let release = {
        url:process.env.WEBHOOK,
        method: "POST",
        headers: headers,
        json: {
            "content": "**Daily Monitor Cache Cleaning Done, Starting Next Cycle!**"
        }    
      };
      request(release);
    cycle++;
  } else {
    newStock = arr;
    currentShallow = [];
    for (i in currentStock) {
      currentShallow.push(currentStock[i].id);
    };

    var newItems = findNewItems(newStock, currentShallow);
    for (i in newItems) {
      console.log('NEW ITEM: ' + newItems[i].link);
      
      let release = {
        url:process.env.WEBHOOK,
        method: "POST",
        headers: headers,
        json: {
          embeds: [{
            color: 15844367,
            thumbnail: {
              'url': newItems[i].thumbnail
            },
            author: {
              name: 'Nike Web (India)',
              icon_url: 'https://i.imgur.com/q9Z4cek.png',
              url: 'https://www.nike.com/launch/',
            },
            title: `RESTOCK - ${((newItems[i].name).toUpperCase())}`,
            url: newItems[i].link,
            fields: [
              {
                name: 'Item:',
                value: newItems[i].name,
                inline: true
              },
              {
                name: 'Color:',
                value: newItems[i].color,
                inline: true
              },
              {
                name: 'Method:',
                value: newItems[i].release,
                inline: true
              },
              {
                name: 'Style Code:',
                value: newItems[i].stylecolor,
                inline: true
              },
              {
                name: 'Price:',
                value: "**"+newItems[i].currency+"** "+ newItems[i].price,
                inline: true
  
              },
              {
                name: 'Type:',
                value: newItems[i].type,
                inline: true
  
              },
              {
                name: 'Status:',
                value: newItems[i].status,
                inline: true
              },
              {
                name: 'Size:',
                value: newItems[i].size,
                inline: true
  
              },
              {
                name: 'Stock Level:',
                value: newItems[i].stockcount,
                inline: true
  
              },
              {
                name: 'Product Link:',
                value: newItems[i].link
              },
              {
                name: 'Other Links:',
                value: "[Cart]"+"(https://www.nike.com/cart)" + " | " + "[StockX]" + "(https://stockx.com/search?s="+newItems[i].stylecolor+")" +" | " + "[eBay]" + "(https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2499334.m570.l1313&_nkw="+newItems[i].stylecolor+")" +" | " + "[Goat]" + "(https://www.goat.com/search?query="+newItems[i].stylecolor+"&_sacat=0)"
              }
            ],
            timestamp: new Date(),
				    footer: {
              "text": 'Wise Monitors | The Wise IO',
					  "icon_url": 'https://i.imgur.com/q9Z4cek.png',
				    }
          }]
      }
    }
    request(release);
    };

    var restockedItems = findRestocks(currentStock, newStock, currentShallow);
    for (i in restockedItems) {
      console.log('RESTOCK: ' + restockedItems[i].link);
      
      let rest = {
        url:process.env.WEBHOOK,
        method: "POST",
        headers: headers,
        json: {
        embeds: [{
          color: 15844367,
          thumbnail: {
            'url': restockedItems[i].thumbnail
          },
          author: {
            name: 'Nike Web (India)',
            icon_url: 'https://i.imgur.com/q9Z4cek.png',
            url: 'https://www.nike.com/launch/',
          },
          title: `RESTOCK - ${((restockedItems[i].name).toUpperCase())}`,
          url: restockedItems[i].link,
          fields: [
            {
              name: 'Item:',
              value: restockedItems[i].name,
              inline: true
            },
            {
              name: 'Color:',
              value: restockedItems[i].color,
              inline: true
            },
            {
              name: 'Method:',
              value: restockedItems[i].release,
              inline: true
            },
            {
              name: 'Style Code:',
              value: restockedItems[i].stylecolor,
              inline: true
            },
            {
              name: 'Price:',
              value: "**"+restockedItems[i].currency+"** "+restockedItems[i].price,
              inline: true

            },
            {
              name: 'Type:',
              value: restockedItems[i].type,
              inline: true

            },
            {
              name: 'Status:',
              value: restockedItems[i].status,
              inline: true
            },
            {
              name: 'Size:',
              value: restockedItems[i].size,
              inline: true

            },
            {
              name: 'Stock Level:',
              value: restockedItems[i].stockcount,
              inline: true

            },
            {
              name: 'Product Link:',
              value: restockedItems[i].link
            },
            {
              name: 'Other Links:',
              value: "[Cart]"+"(https://www.nike.com/cart)" + " | " + "[StockX]" + "(https://stockx.com/search?s="+restockedItems[i].stylecolor+")" +" | " + "[eBay]" + "(https://www.ebay.com/sch/i.html?_from=R40&_trksid=p2499334.m570.l1313&_nkw="+restockedItems[i].stylecolor+")" +" | " + "[Goat]" + "(https://www.goat.com/search?query="+restockedItems[i].stylecolor+"&_sacat=0)"
            }
          ],
          timestamp: new Date(),
				    footer: {
					  "text": 'Wise Monitors | Wise IO',
					  "icon_url": 'https://i.imgur.com/q9Z4cek.png',
				    }
        }]
      }}
      request(rest);
    };

    console.log('Cycle ' + cycle + ' complete!');
    console.log(Date());
    console.log(' ');
    currentStock = newStock;
    newStock = [];
    cycle++;
  }
};


function monitor() {

  var completeArr = [];

  let FirstURL = {
    url: `https://api.nike.com/product_feed/threads/v2/?anchor=0&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
    headers: {
        "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        "authority":"api.nike.com",
        "method":"GET",
        "scheme": "https",
        "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "upgrade-insecure-requests": "1"
    },
    timeout:process.env.SCRAPE_TIMEOUT
};

let SecondURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=50&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let ThirdURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=100&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let FourthURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=150&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let FifthURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=200&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let SixthURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=250&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let SeventhURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=300&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let EighthURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=350&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let NinethURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=400&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let TenthURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=450&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};

let EleventhURL = {
  url: `https://api.nike.com/product_feed/threads/v2/?anchor=500&count=50&filter=marketplace%28IN%29&filter=language%28en-GB%29&filter=inStock%28true%29&filter=productInfo.merchPrice.discounted%28false%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom`,
  headers: {
      "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "authority":"api.nike.com",
      "method":"GET",
      "scheme": "https",
      "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1"
  },
  timeout:process.env.SCRAPE_TIMEOUT
};


  rp.get(FirstURL, function(err){})
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })


  .then(() => {
    return rp.get(SecondURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })



  .then(() => {
    return rp.get(ThirdURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })



  .then(() => {
    return rp.get(FourthURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })


  .then(() => {
    return rp.get(FifthURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })

  .then(() => {
    return rp.get(SeventhURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })

  .then(() => {
    return rp.get(EighthURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })

  .then(() => {
    return rp.get(NinethURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })


  .then(() => {
    return rp.get(TenthURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })

  .then(() => {
    return rp.get(EleventhURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
  })


  .then(() => {
    return rp.get(SixthURL, function(err){});
  })
  .then((body) => {
    let json = JSON.parse(body);
    for (x in json.objects) {
      if(!json.objects[x].publishedContent.properties.custom.restricted) {
        completeArr.push(json.objects[x]);
      }
    }
    return completeArr;
  })
  .then ((completeArr) => {
    updates(completeArr);
  })
  .catch ((err) => {
    console.log(err);
  })
  setTimeout(() => {
    monitor();
  }, refreshDelay);
};

monitor();
