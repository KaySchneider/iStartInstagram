var PLACEHOLDER_IMAGE = "loading.gif";
var WU_API_KEY = "8f3dbc28c93f3c7d";//api key from weatherunderground.com
var instagramClientId = "4a9e066d519149f28a325d95de4c6429";
/**
 * we use this code base for two applications and check wich application
 * will perform much better.
 * One "instaWeather"
 * Weather "live" backgrounds from instagramm if the user is online
 *
 * retro "Weather"
 * Weather app in retro Design
 *
 * digital "Weather"
 * Weather in digital nativ design!
 *
 * "pirate" "Weather"
 * Weather in pirate Mode!!
 * --> With arrrs and rooos
 *
 * "social pirate" weather
 * --> share your weather automatically every day one time you watch the weather!
 */
var instagramm_active = true;

chrome.runtime.onMessage.addListener(
    function(request,sender,response) {
        console.log(window.scrollPos,window, "HERE");
        if(request.cmd === 'clicktile') {
            response({data:[window.scrollPos,window]});
            //console.log(window.scrollPos,window);
        }
    }
);
/**
 * include here the thirdparty api for communication with the istart API
 * @type {{tabid: number, extensionUrl: *, launchlink: Function}}
 */
var istartliveTileApi = {
    tabid : 0,
    extensionUrl: chrome.extension.getURL('html/instaWidget.html'),
    launchlink: function (data) {
        chrome.runtime.sendMessage({cmd: "launchlink",url:this.extensionUrl,launchlink:data.getAttribute('linkto'),tabId:this.tabId}, function(response) {
            //filter the message direct here
            if(response.url !== extensionUrl) {
                return false;
            }
            if(response.response==='ok') {
                console.log('everything is fine');
            } else {
                console.log("wahuu...something is gone wrong");
            }
        });
    }
};

//receive the loaders tab id
//chrome.tabs.getCurrent(function(item)  {
  //  istartliveTileApi.tabid = item.id;
//})

var loadInstagram = function(path,callback) {

    chrome.runtime.sendMessage({cmd:'get',url:path},function(response) {
        console.log(response);
        callback(response);
    })
}

var loadImage = function(uri, callback) {
    chrome.runtime.sendMessage({cmd:'loadImage',uri:uri},function(response) {
        console.log(response);
        callback(response);
    })
   /* var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function() {
        callback(window.URL.createObjectURL(xhr.response), uri);
    }
    xhr.open('GET', uri, true);
    xhr.send();*/
}

var defaults = {
    forecast: false,
    time:+new Date(),
    location: 'autoip',
    farenheit: true,
    seconds: true,
    timezone:'Europe/Berlin'
};


angular.module('myApp', ['ngRoute'])
    .factory('onlineStatus', ["$window", "$rootScope", function ($window, $rootScope) {
        var onlineStatus = {};
        //online detection. This should be called bevor we call the weaterModel to load new data.
        //if we are offline we show an offline screen that the weather data cant be loaded an we show the old data
        //or the special screen
        onlineStatus.onLine = $window.navigator.onLine;
        onlineStatus.isOnline = function() {
            return onlineStatus.onLine;
        };
        $window.addEventListener("online", function () {
            onlineStatus.onLine = true;
            $rootScope.$digest();
        }, true);
        $window.addEventListener("offline", function () {
            onlineStatus.onLine = false;
            $rootScope.$digest();
        }, true);
        return onlineStatus;
    }])

    .provider('ExternalResource', function() {
        this.$get = ['$q', '$http', function($q, $http) {
            var self = this;
            return {
                loadImage: function (uri,allData) {
                    var d = $q.defer();
                    var allData = allData;
                    loadImage(uri, function(data) {
                        console.log(data);
                        d.resolve({'blob':data.blob,'all':allData});
                    });
                    /*$http({
                        method: 'GET',
                        url: uri,
                        responseType: 'blob',
                        cache: true
                    }).success(function(data) {
                            var image = window.URL.createObjectURL(data);

                            d.resolve({'blob':image,'all':allData});
                        }).error(function(err) {
                            d.reject(err);
                        });*/
                    return d.promise;

                }

            }
        }];
    })
    .provider('Instagram', function () {

        this.setClientId = function(clientId) {
            if(clientId) this.clientId = clientId;
        };

        this.getUrl = function(type, options) {
            switch(type) {
                case 'locationId':
                    return "https://api.instagram.com/v1/locations/search?lat=" + options.lat + "&lng=" + options.long + "&client_id=" + this.clientId;
                    break;
                case 'locationIdMedia':
                    return "https://api.instagram.com/v1/locations/" + options.locationId +  "&lng=" + long + "&client_id=" + this.clientId;
                    break;
                case 'locationMedia':
                    //get media for location id, the location id comes from the locationId call
                    return "https://api.instagram.com/v1/locations/" + options.geoid + "/media/recent?client_id=" + this.clientId;
                    break;
                case 'mediaSearch':
                    return "https://api.instagram.com/v1/media/search?lat=" + options.lat + "&lng=" + options.long + "&distance=5000" + "&client_id=" + this.clientId;
                    break;
                case 'mediaByTag':
                    return "https://api.instagram.com/v1/tags/"+options.tag+"/media/recent?client_id=" + this.clientId ;
                    break
                case 'topImages':
                    return "https://api.instagram.com/v1/media/popular?client_id=" + this.clientId;
                    break;
            }

        }

        this.$get = ['$q', '$http', function($q, $http) {
            var self = this;
            return {
                getLocationsAround: function (latLong) {
                    var d = $q.defer();
                    $http({
                        method: 'GET',
                        url: self.getUrl('locationId',latLong),
                        cache: true
                    }).success(function(data) {
                            d.resolve(data.data);
                            //console.log(data,this,self);
                            //this.getImagesForLocId(data.data[0].id)
                        }).error(function(err) {
                            d.reject(err);
                        });
                    return d.promise;

                },
                getImagesForLatLong: function(latLng) {
                    var d = $q.defer();
                    var scope = d;
                    loadInstagram(self.getUrl('topImages', {tag:'Leonberg'}),function(data){
                        var dataObject = angular.fromJson(data.json);

                        scope.resolve(dataObject.data);
                    })

                    /*
                    var d = $q.defer();
                    $http({
                        method: 'GET',
                        //url: self.getUrl('mediaSearch',latLng),
                        url: self.getUrl('topImages', {tag:'Leonberg'}),
                        cache: true
                    }).success(function(data) {
                            d.resolve(data.data);
                            //console.log(data,this,self);
                            //this.getImagesForLocId(data.data[0].id)
                        }).error(function(err) {
                            d.reject(err);
                        });*/
                    return d.promise;
                },
                getImagesForLocId: function(locid) {
                    //id: "430259
                    var d = $q.defer();
                    $http({
                        method: 'GET',
                        url: self.getUrl('locationMedia',{'geoid':locid}),
                        cache: true
                    }).success(function(data) {
                            d.resolve(data.data);
                        }).error(function(err) {
                            d.reject(err);
                        });
                    return d.promise;
                }

            }
        }];
    }

    )

    .factory('OfflineStorage', function () {
        //We store the weather data on the localStorage so there is no need to capture every time the weather from the API
        var defaults = {
            forecast: false,
            time:+new Date(),
            location: 'autoip',
            farenheit: true,
            seconds: true,
            timezone:''
        };
        var service = {
            save: function() {
                chrome.storage.local.set({'iswe': angular.toJson( {forecast: service.forecast, ts:+new Date(), location: service.location, timezone:service.timezone ,farenheit:service.farenheit,seconds:service.seconds , changes:service.changes})});
            }
        }

        return service;
    })

    .config(['InstagramProvider', function(InstagramProvider){
        InstagramProvider.setClientId(instagramClientId);
    }])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '../templates/home.html',
                controller: 'MainCtrl'
            })
            .otherwise({redirectTo: '/'});
    }])
    .controller('MainCtrl', ['$scope', '$timeout', 'Instagram','ExternalResource','$window',
        function($scope, $timeout,Instagram,ExternalResource,$window) {
            $scope.date = {};
            $scope.weather = {}
            $scope.locale = '';
            $scope.imageBg = './img/fog.gif';
            $scope.showImage = 0;
            $scope.bgImageCount = 0;
            $scope.scrollPos = 0;
            $scope.direction ='right';

            $scope.click = function() {

              var direction = $scope.direction;
                switch(direction) {

                    case 'up':

                        break;
                    case 'down':

                        break;
                    case 'left':
                        if($scope.scrollPos == 0) {
                            $scope.direction = 'right';
                            $timeout($scope.click, 2000);
                            return false;
                        }
                        var stripe = document.getElementById('imagestrip');
                        var num = parseInt( stripe.style.top.replace('%','') )
                        if( isNaN( num ) ) {
                            stripe.style.top =  +100+"%";
                        } else
                            stripe.style.top = num + 100 + "%";
                        $scope.scrollPos--;
                        break;
                    case 'right':
                        if($scope.scrollPos === $scope.bgImageCount) {
                            $scope.direction = 'left';
                            $timeout($scope.click, 2000);
                            return false;
                        }
                        var stripe = document.getElementById('imagestrip');
                        var num = parseInt( stripe.style.top.replace('%','') )
                        if( isNaN( num ) ) {
                            stripe.style.top =  -100+"%";
                        } else
                            stripe.style.top = num - 100 + "%";
                        $scope.scrollPos++;
                        break;
                }
                $timeout($scope.click, 2000);
            }

            //get the locales for displaying the date
;
            $scope.imageBg = [];

            /**
             * TODO: implement an service and an directive for the view to inject here some picture
             * @constructor
             */
            var InstagrammPictures = function() {
                Instagram.getImagesForLatLong()
                    .then(function(data) {
                        // for(var i in data) {
                        // Instagram.getImagesForLocId(data[i].id)
                        //    .then(function(data) {
                        $scope.bgImageCount = data.length;
                        $scope.click();
                        for(item in data) {
                            ExternalResource.loadImage(data[item].images.standard_resolution.url,data[item])
                                .then(function(imageBlob,allImageData) {
                                    $scope.imageBg.push(  {'blob':imageBlob.blob,'all':imageBlob.all} );
                                });
                        }

                        // });
                        // }

                    });
            };

            InstagrammPictures();
            //check the offline cache at first


        }])

    .directive('localimage', function() {
        /**
         * parse the image from weatherunderground.com to an localimage
         * to download other imagesets from weatherunderground you can use
         * my simple nodejs downloader from github:
         * https://github.com/KaySchneider/nimloadhelper
         */
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                // wait until after $apply
                scope.variable = attrs.localimage;
                var  fileName = scope.variable.split('/').pop();
                var injectName = './img/' + fileName;
                element[0].src = injectName;
            },
            replace:true
        }
    })
    .directive('loadedimage', function () {
        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                scope.$watch('imageBg', function(newImage) {

                    var image = document.createElement('img');
                    var width = attrs.imwidth;
                    if(attrs.class == 'true') {
                        image.setAttribute('style','z-index:-100;height:'+width + '%');
                    } else
                        image.setAttribute('style','z-index:-100;height:'+width + '%');
                    image.src =attrs.imsrc;
                    element[0].innerHTML = "";
                    element[0].setAttribute('linkto', scope.imageBg[attrs.imid].link)
                    element[0].appendChild( image );
                    element[0].addEventListener('click', function() {

                        istartliveTileApi.launchlink(this);
                    })
                });
            },
            replace: true

        }
    })
    .directive('i18n', function () {
        /**
         * make use of the chrome.i18n API to localise the application
         * into some languages wich are defined in _locales folder
         */
        return {
            restrict: 'E',
            link: function(scope, element, attrs) {
                var key = element[0].innerHTML;
                var translated = chrome.i18n.getMessage(key);
                element[0].innerHTML = translated;
            },
            replace:true
        }
    })
;


