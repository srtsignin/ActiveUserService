# ActiveUserService
Provides course lists and students currently signed into a room or being tutored during in-classroom hours.

GET /courses?search=queryString

**Response:**

```js
{
    'message': 'Receiving courses containing the following query string: queryString',
    'success': true,
    'data': ['List of courses names containing queryString']
}
```

GET /courses

**Response:**

```js
{
    'message': 'Receiving courses containing the following query string: queryString',
    'success': true,
    'data': {'Map of department to [course name list]'}
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
    'data': ['Course name list for the specified student']
}
```
