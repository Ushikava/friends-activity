export const ru = {
  // nav
  'nav.home':    'Главная',
  'nav.gallery': 'Галерея',
  'nav.games':   'Игры',
  'nav.places':  'ИРЛ фото',
  'nav.movies':  'Кино',
  'nav.profile': 'Профиль',

  // common
  'common.empty':           'Пока ничего нет',
  'common.showMore':        'Показать больше →',
  'common.delete':          'Удалить',
  'common.save':            'Сохранить',
  'common.saving':          'Сохранение...',
  'common.upload':          'Загрузить',
  'common.uploading':       'Загружаем…',
  'common.uploadHint':      'Нажмите или вставьте (Ctrl+V)',
  'common.descPlaceholder': 'Описание (необязательно)',
  'common.titlePlaceholder':'Название',
  'common.add':             'Добавить',
  'common.adding':          'Добавляем…',
  'common.errNoFile':       'Выберите изображение',
  'common.errUpload':       'Не удалось загрузить',
  'common.errAdd':          'Не удалось добавить',
  'common.errNoTitle':      'Введите название',

  // home
  'home.title':           'Главная',
  'home.stats':           'Статистика',
  'home.stat.screenshots':'скриншотов',
  'home.stat.photos':     'фото',
  'home.stat.movies':     'фильмов',
  'home.stat.games':      'игр',
  'home.gallery':         'Галерея',
  'home.places':          'ИРЛ Фото',
  'home.movies':          'Фильмы / Сериалы',
  'home.games':           'Игры',

  // gallery / places
  'gallery.title':    'Галерея',
  'gallery.addPhoto': 'Добавить фото',
  'places.title':     'ИРЛ фото',

  // movies
  'movies.title':   'Фильмы / Сериалы',
  'movies.add':     'Добавить фильм',
  'movies.watched': 'Просмотрено',

  // games
  'games.title':    'Игры',
  'games.add':      'Добавить игру',
  'games.played':   'Пройдено',
  'games.steamLink':'Ссылка на Steam (необязательно)',

  // activity
  'activity.title': 'Активность',
  'activity.less':  'меньше',
  'activity.more':  'больше',
  'activity.plural': (n) => {
    if (n === 1) return '1 событие'
    if (n >= 2 && n <= 4) return `${n} события`
    return `${n} событий`
  },
  'activity.months': ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'],
  'activity.days':   ['Пн','','Ср','','Пт','',''],

  // login
  'login.password': 'Пароль',
  'login.submit':   'Войти',
  'login.loading':  'Вход...',
  'login.observer': 'наблюдатель',

  // profile
  'profile.title':              'Профиль',
  'profile.greeting':           'Привет,',
  'profile.changeName.title':   'Изменить имя',
  'profile.changeName.new':     'Новое имя',
  'profile.changeName.password':'Текущий пароль',
  'profile.changeName.saved':   'Имя пользователя изменено',
  'profile.changePass.title':   'Изменить пароль',
  'profile.changePass.current': 'Текущий пароль',
  'profile.changePass.new':     'Новый пароль',
  'profile.changePass.confirm': 'Повторите пароль',
  'profile.changePass.saved':   'Пароль изменён',
  'profile.changePass.mismatch':'Пароли не совпадают',
  'profile.lang.title':         'Язык',
  'profile.lang.ru':            'Русский',
  'profile.lang.en':            'English',
}

export const en = {
  // nav
  'nav.home':    'Home',
  'nav.gallery': 'Gallery',
  'nav.games':   'Games',
  'nav.places':  'IRL Photos',
  'nav.movies':  'Movies',
  'nav.profile': 'Profile',

  // common
  'common.empty':           'Nothing here yet',
  'common.showMore':        'Show more →',
  'common.delete':          'Delete',
  'common.save':            'Save',
  'common.saving':          'Saving...',
  'common.upload':          'Upload',
  'common.uploading':       'Uploading…',
  'common.uploadHint':      'Click or paste (Ctrl+V)',
  'common.descPlaceholder': 'Description (optional)',
  'common.titlePlaceholder':'Title',
  'common.add':             'Add',
  'common.adding':          'Adding…',
  'common.errNoFile':       'Select an image',
  'common.errUpload':       'Upload failed',
  'common.errAdd':          'Failed to add',
  'common.errNoTitle':      'Enter a title',

  // home
  'home.title':           'Home',
  'home.stats':           'Statistics',
  'home.stat.screenshots':'screenshots',
  'home.stat.photos':     'photos',
  'home.stat.movies':     'movies',
  'home.stat.games':      'games',
  'home.gallery':         'Gallery',
  'home.places':          'IRL Photos',
  'home.movies':          'Movies / Series',
  'home.games':           'Games',

  // gallery / places
  'gallery.title':    'Gallery',
  'gallery.addPhoto': 'Add photo',
  'places.title':     'IRL Photos',

  // movies
  'movies.title':   'Movies / Series',
  'movies.add':     'Add movie',
  'movies.watched': 'Watched',

  // games
  'games.title':    'Games',
  'games.add':      'Add game',
  'games.played':   'Completed',
  'games.steamLink':'Steam link (optional)',

  // activity
  'activity.title': 'Activity',
  'activity.less':  'less',
  'activity.more':  'more',
  'activity.plural': (n) => `${n} ${n === 1 ? 'event' : 'events'}`,
  'activity.months': ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  'activity.days':   ['Mon','','Wed','','Fri','',''],

  // login
  'login.password': 'Password',
  'login.submit':   'Sign in',
  'login.loading':  'Signing in...',
  'login.observer': 'observer',

  // profile
  'profile.title':              'Profile',
  'profile.greeting':           'Hello,',
  'profile.changeName.title':   'Change name',
  'profile.changeName.new':     'New name',
  'profile.changeName.password':'Current password',
  'profile.changeName.saved':   'Username updated',
  'profile.changePass.title':   'Change password',
  'profile.changePass.current': 'Current password',
  'profile.changePass.new':     'New password',
  'profile.changePass.confirm': 'Confirm password',
  'profile.changePass.saved':   'Password changed',
  'profile.changePass.mismatch':'Passwords do not match',
  'profile.lang.title':         'Language',
  'profile.lang.ru':            'Русский',
  'profile.lang.en':            'English',
}
