# ActiveUserService
Provides course lists and students currently signed into a room or being tutored during in-classroom hours.

GET /courses?search=queryString

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

GET /classes

**Header**
```js
'StudentToken': 'studentToken'
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
    'message': 'Error: StudentToken not provided',
    'success': false,
    'data': null
}
```

GET /activeUsers?roomId=percopo

**Header**
```js
'RosefireToken': 'rosefireToken'
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
                    "number": "333"
                }
            ],
            "name": "Collin Moore",
            "problemDescription": "I need help with transactions",
            "username": "moorect"
        }
    ]
}
```

POST /activeUsers?roomId=percopo

**Headers**

```js
'RosefireToken': 'rosefireToken'
'CardfireToken': 'cardfireToken'
```

**Body**

```js
{
    "courses" : [
        {
			"department": "CSSE",
			"number": "333",
			"name": "Intro to Databases"
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

DELETE /activeUsers?roomId=percopo&username=moorect

**Headers**
```js
'RosefireToken': 'rosefireToken'
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
