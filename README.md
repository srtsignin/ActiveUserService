# ActiveUserService
Provides course lists and students currently signed into a room or being tutored during in-classroom hours.

###GET /courses?search=queryString

**Header**
```js
'AuthToken': 'authToken'
```

**Response:**

```js
{
    'message': 'Receiving courses containing the following query string: queryString',
    'success': true,
    'data': [
                {
                    'name': 'Introduction to Databases',
                    'number': 333,
                    'department': 'CSSE',
                    'queryString': 'CSSE333 Introduction to Databases'
                }, ...
            ]
}
```

###GET /classes

>This is currently a placeholder implementation, need LDAP access to make this cool

**Header**
```js
'AuthToken': 'authToken'
```

**Response:**

```js
{
    'message': 'Returning courses for studentName',
    'success': true,
    'data': [
                {
                    'name': 'Introduction to Databases',
                    'number': 333,
                    'department': 'CSSE',
                    'queryString': 'CSSE333 Introduction to Databases'
                }, ...
            ]
}

{
    'message': 'Error: AuthToken not provided',
    'success': false,
    'data': null
}
```

###GET /activeUsers?roomId=percopo

**Header**
```js
'AuthToken': 'authToken'
```

**Response**

```js
{
    "message": "Successfully retrieved student list for room: percopo",
    "success": true,
    "data": [
        {
            "checkInTime": 1539746887681,
            "courses": [
                {
                    "department": "CSSE",
                    "name": "Intro to Databases",
                    "number": "333",
                    'queryString': 'CSSE333 Introduction to Databases'
                }
            ],
            "name": "Collin Moore",
            "problemDescription": "I need help with transactions",
            "username": "moorect"
        }
    ]
}
```

###POST /activeUsers?roomId=percopo

**Headers**

```js
'AuthToken': 'authToken'
```

**Body**

```js
{
    "courses" : [
        {
			"department": "CSSE",
			"number": "333",
            "name": "Intro to Databases",
            'queryString': 'CSSE333 Introduction to Databases'
		}    
    ],
    "problemDescription": "I need help with transactions"
}
```

**Response**


```js
{
    'message': `Successfully retrieved student list for room: percopo`,
    'success': true,
    'data': {
        "deleted": 0,
        "errors": 0,
        "inserted": 0,
        "replaced": 1,
        "skipped": 0,
        "unchanged": 0
    }
}
```

###DELETE /activeUsers?roomId=percopo&username=moorect

**Headers**
```js
'AuthToken': 'authToken'
```

**Response**
```js
{
    "message": "Successfully removed moorect from $",
    "success": true,
    "data": {
        "deleted": 0,
        "errors": 0,
        "inserted": 0,
        "replaced": 1,
        "skipped": 0,
        "unchanged": 0
    }
}
```
