from django.contrib import admin
from django.urls import path

from .views import *

app_name = 'buildings'
urlpatterns = [
	path('get-schools/', GetSchools.as_view(), name='School List'),
]