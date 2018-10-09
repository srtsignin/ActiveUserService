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
